const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

// DNS rieng cho tien trinh Node khi DNS mang khong tra loi truy van Atlas SRV.
if (process.env.MONGODB_DNS_SERVERS) {
  require("node:dns").setServers(
    process.env.MONGODB_DNS_SERVERS.split(",").map((server) => server.trim()).filter(Boolean)
  );
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
}));

app.use(express.json({ limit: "100kb" }));

// Cấu trúc dữ liệu thiết bị
const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    deviceType: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Số lượng phải là số nguyên",
      },
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Đang sử dụng",
        "Hư hỏng",
        "Đang sửa chữa",
        "Ngừng sử dụng",
      ],
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "devices",
  }
);

const Device = mongoose.model("Device", deviceSchema);

// Chỉ chấp nhận các trường được phép sửa
const allowedFields = [
  "deviceId",
  "name",
  "deviceType",
  "room",
  "brand",
  "model",
  "quantity",
  "status",
  "purchaseDate",
  "description",
];

function validateBody(req, res, next) {
  const body = req.body;

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length === 0
  ) {
    return res.status(400).json({
      message: "Cần gửi dữ liệu thiết bị dạng JSON",
    });
  }

  const invalidFields = Object.keys(body).filter(
    (key) => !allowedFields.includes(key)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: "Có trường dữ liệu không được phép",
      fields: invalidFields,
    });
  }

  next();
}

// Kiểm tra backend và kết nối database
app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "error",
    database: connected ? "connected" : "disconnected",
  });
});

// Kiểm tra ObjectId trước khi xử lý API có :id
app.param("id", (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({
      message: "ID thiết bị không hợp lệ",
    });
  }

  next();
});

// Danh sách và tìm kiếm thiết bị
app.get("/api/devices", async (req, res) => {
  if (
    req.query.search !== undefined &&
    typeof req.query.search !== "string"
  ) {
    return res.status(400).json({
      message: "Từ khóa tìm kiếm phải là chuỗi",
    });
  }

  const search = (req.query.search || "").trim();

  if (search.length > 100) {
    return res.status(400).json({
      message: "Từ khóa tối đa 100 ký tự",
    });
  }

  let filter = {};

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter = {
      $or: ["deviceId", "name", "deviceType", "room"].map(
        (field) => ({
          [field]: { $regex: escaped, $options: "i" },
        })
      ),
    };
  }

  const devices = await Device.find(filter).sort({ deviceId: 1 });
  res.json(devices);
});

// Xem chi tiết
app.get("/api/devices/:id", async (req, res) => {
  const device = await Device.findById(req.params.id);

  if (!device) {
    return res.status(404).json({
      message: "Không tìm thấy thiết bị",
    });
  }

  res.json(device);
});

// Thêm thiết bị
app.post("/api/devices", validateBody, async (req, res) => {
  const device = await Device.create(req.body);
  res.status(201).json(device);
});

// Cập nhật thiết bị
app.put("/api/devices/:id", validateBody, async (req, res) => {
  const device = await Device.findById(req.params.id);

  if (!device) {
    return res.status(404).json({
      message: "Không tìm thấy thiết bị",
    });
  }

  device.set(req.body);
  await device.save();

  res.json(device);
});

// Xóa thiết bị
app.delete("/api/devices/:id", async (req, res) => {
  const device = await Device.findByIdAndDelete(req.params.id);

  if (!device) {
    return res.status(404).json({
      message: "Không tìm thấy thiết bị",
    });
  }

  res.json({ message: "Đã xóa thiết bị" });
});

// Đường dẫn không tồn tại
app.use((req, res) => {
  res.status(404).json({ message: "API không tồn tại" });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({
      message: "Mã thiết bị đã tồn tại",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ",
      errors: Object.values(err.errors).map((item) => item.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Sai kiểu dữ liệu",
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Nội dung JSON không hợp lệ",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      message: "Dữ liệu gửi lên quá lớn",
    });
  }

  if (
    err.name === "MongoNetworkError" ||
    err.name === "MongoServerSelectionError" ||
    mongoose.connection.readyState !== 1
  ) {
    return res.status(503).json({
      message: "Không thể kết nối cơ sở dữ liệu",
    });
  }

  console.error("API error:", err.name);

  res.status(500).json({
    message: "Lỗi máy chủ",
  });
});

// Chỉ mở server sau khi kết nối MongoDB thành công
async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("Thiếu MONGODB_URI trong backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    // Bảo đảm unique index của deviceId đã được tạo
    await Device.init();

    console.log("Đã kết nối MongoDB Atlas");

    const port = Number(process.env.PORT) || 5000;

    app.listen(port, "0.0.0.0", () => {
      console.log(`Backend chạy tại http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Không thể khởi động backend:", err.name);
    console.error("Kiểm tra cấu hình Atlas, IP và mã thiết bị trùng.");
    process.exit(1);
  }
}

start();
