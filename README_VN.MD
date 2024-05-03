
# Quản lý tài khoản phiên bản 2

## 🌟 Tổng quan
**Quản lý tài khoản phiên bản 2** là một nền tảng tinh vi được thiết kế để tự động hóa quản lý và phân phối tài khoản cho thuê. Hệ thống này được xây dựng bằng **NestJS** và **TypeORM**, đi kèm với một **Telegram Bot** để tương tác người dùng một cách linh hoạt và mượt mà. Mục tiêu là tối ưu hóa hoạt động và nâng cao hiệu suất cho việc cho thuê tài khoản.

## 🚀 Tính năng
- **Quản lý tự động**: Tối ưu hóa tất cả các khía cạnh của quy trình cho thuê tài khoản.
- **Giao diện Telegram Bot**: Cung cấp giao diện thân thiện với người dùng để tương tác dễ dàng.
- **Công nghệ đa dạng**: Sử dụng một bộ công cụ và framework hiện đại để đảm bảo hiệu suất và đáng tin cậy tốt nhất.

## 🛠 Công nghệ sử dụng
- **NestJS**: Một framework Node.js tiến bộ cho các ứng dụng phía máy chủ có khả năng mở rộng.
- **TypeORM**: Một framework ORM tương thích trên nhiều nền tảng bao gồm NodeJS và Electron.
- **MySQL**: Hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở mạnh mẽ.
- **Swagger**: Công cụ mạnh mẽ để tài liệu hóa các API.
- **Jest**: Framework để thực hiện kiểm thử JavaScript dễ thương.
- **Casl**: Đơn giản hóa việc xử lý kiểm soát truy cập trong các ứng dụng NestJS.
- **Nodemailer**: Giúp gửi email dễ dàng thông qua các ứng dụng Node.js.
- **Class Validator & Class Transformer**: Tăng cường tính năng xác thực và biến đổi trong NestJS.

## 🔧 Bắt đầu

### Yêu cầu tiên quyết
- Đảm bảo bạn đã cài đặt **Node.js**, **NestJS**, và **TypeORM**.
- Cần có một phiên bản **MySQL** để thực hiện các hoạt động cơ sở dữ liệu.
- Cần có một **Telegram Bot** và **Mail Server** được cấu hình để sử dụng đầy đủ chức năng.

### 🛠 Cài đặt
1. **Sao chép kho**: 
    ```bash
    git clone https://github.com/Nam077/account-manager-v2.git
    ```
2. **Cài đặt các phụ thuộc** (sử dụng npm hoặc yarn):
    ```bash
    npm install
    # hoặc
    yarn install
    ```
3. **Cấu hình biến môi trường**:
    ```bash
    cp .env.example .env
    cp .env.development.example .env.development.local
    ```
4. **Khởi chạy ứng dụng** (sử dụng npm hoặc yarn):
    ```bash
    npm run start:dev
    # hoặc
    yarn start:dev
    ```

### 🌐 Truy cập
Truy cập vào `http://localhost:[PORT]` như được định nghĩa trong cài đặt `.env` của bạn.

## ⚙️ Cấu hình
Chi tiết về cấu hình cơ sở dữ liệu, JWT, lập lịch, email, và Telegram Bot thông qua biến môi trường.

## 📝 Sử dụng
Hướng dẫn về cách vận hành bot và quản lý tài khoản một cách hiệu quả.

## 🤝 Đóng góp
Quan tâm đóng góp? Vui lòng xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách giúp cải thiện Quản lý tài khoản phiên bản 2.

## 📜 Giấy phép
Dự án này được cấp phép theo Giấy phép MIT - xem [LICENSE.md](LICENSE.md) để biết thêm chi tiết.

## 📞 Hỗ trợ
Để được hỗ trợ, liên hệ qua Telegram hoặc mở một vấn đề trên GitHub.

## 👤 Tác giả
- **Nam077** - [GitHub](http://github.com/Nam077)
- **Nguyễn Văn Nam** - [Facebook](http://facebook.com/nam077.me)

🌐 Truy cập [trang GitHub](https://github.com/Nam077/account-manager-v2) để cập nhật mới nhất.

