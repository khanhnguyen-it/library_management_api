# 📚 Library Management API

RESTful API cho hệ thống quản lý thư viện, viết bằng Node.js + Express + MySQL.

## 🚀 Công nghệ sử dụng
- Node.js + Express
- MySQL + mysql2
- JWT authentication
- RESTful routing

## 📂 Cấu trúc thư mục
```
controllers/       # Xử lý logic các chức năng
routers/           # Định tuyến API
models/            # Định nghĩa cấu trúc dữ liệu
middlewares/       # Xử lý xác thực, phân quyền
utils/             # Tiện ích (db, response, logger...)
index.js           # Entry point
.env               # Cấu hình môi trường
```

## 🔐 Xác thực người dùng
Sử dụng JWT token. Gửi token trong header:
```
Authorization: Bearer <token>
```
