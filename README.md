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

## 📦 Cài đặt
```bash
git clone https://github.com/your-repo/library-api.git
cd library-api
npm install
cp .env.example .env
npm start
```

## 📮 Các nhóm API chính
| Nhóm chức năng | Endpoint |
|----------------|----------|
| Auth           | /api/auth/login, /register, /me |
| Documents      | /api/documents |
| Borrowings     | /api/borrowings |
| Returns        | /api/returns |
| Renewals       | /api/renewals |
| Reservations   | /api/reservations |
| Violations     | /api/violations |
| Payments       | /api/payments |
| Notifications  | /api/notifications |
| Statistics     | /api/statistics |
| Categories     | /api/categories |
| Authors        | /api/authors |
| Publishers     | /api/publishers |
| Users          | /api/users |

## 🧪 Test API
Dùng Postman hoặc Swagger (dưới đây).


---

### ✅ Swagger - swagger.yaml
openapi: 3.0.0
info:
title: Library Management API
version: 1.0.0
tags:
- name: Auth
  description: Đăng nhập & Xác thực
- name: Documents
  description: Tài liệu thư viện
- name: Borrowings
  description: Quản lý mượn tài liệu
  paths:
  /api/auth/login:
  post:
  tags:
  - Auth
  summary: Đăng nhập hệ thống
  requestBody:
  required: true
  content:
  application/json:
  schema:
  type: object
  properties:
  username:
  type: string
  password:
  type: string
  responses:
  '200':
  description: Đăng nhập thành công

/api/documents:
get:
tags:
- Documents
summary: Lấy danh sách tài liệu
responses:
'200':
description: Danh sách tài liệu

    post:
      tags:
        - Documents
      summary: Thêm tài liệu mới
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Document'
      responses:
        '201':
          description: Tài liệu đã được tạo

components:
schemas:
Document:
type: object
properties:
document_title:
type: string
document_type:
type: string
publication_year:
type: number
quantity:
type: number
available_quantity:
type: number
document_status:
type: string
enum: [AVAILABLE, BORROWED, RESERVED, LOST]
