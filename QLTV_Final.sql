-- Tạo Database
CREATE DATABASE IF NOT EXISTS library_management;
USE library_management;

-- Bảng Roles
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    description TEXT 
);

-- Bảng Accounts
CREATE TABLE accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,	
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone_number VARCHAR(20),
    cccd VARCHAR(20) UNIQUE, -- Số căn cước công dân
    member_type ENUM('MEMBER', 'STUDENT', 'UNIVERSITY_STUDENT', 'TEACHER', 'LECTURER') DEFAULT 'MEMBER', -- Thêm loại thành viên
	reader_code VARCHAR(20) NOT NULL UNIQUE, 					-- Mã độc giả (do backend sinh, dùng để gán thẻ)
    institution_name VARCHAR(255),								-- Thêm tên trường học (nếu applicable)
    gender ENUM('MALE', 'FEMALE', 'OTHER'),						-- Giới tính
	date_of_birth DATE, 										-- Ngày sinh
	address VARCHAR(255), 										-- Địa chỉ
    role_id INT,
	status ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE',-- Trạng thái tài khoản
	notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- Bảng Cards
CREATE TABLE cards (
  card_id INT AUTO_INCREMENT PRIMARY KEY,
  card_code VARCHAR(50) NOT NULL UNIQUE,     -- QR/mã vạch
  account_id INT NOT NULL,                   -- người sở hữu thẻ
  issue_date DATE NOT NULL,                  -- ngày cấp
  expiry_date DATE NOT NULL,                 -- ngày hết hạn
  status ENUM('ACTIVE', 'EXPIRED', 'LOST', 'BLOCKED') DEFAULT 'ACTIVE', -- trạng thái
  note TEXT,                                 -- ghi chú (nếu có)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(account_id),                           -- mỗi user chỉ có 1 thẻ
  FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);

-- Bảng Categories
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,                                           -- Mô tả về thể loại
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,              -- Ngày tạo
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng Publishers
CREATE TABLE publishers (
    publisher_id INT AUTO_INCREMENT PRIMARY KEY,
    publisher_name VARCHAR(255) NOT NULL,
    established_year YEAR,                                     -- Năm thành lập (nếu cần)
    address VARCHAR(255),                                      -- Địa chỉ nhà xuất bản (tuỳ chọn)
    phone_number VARCHAR(20),                                  -- Số điện thoại (tuỳ chọn)
    notes TEXT,                                                -- Ghi chú thêm (nếu có)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,             -- Ngày tạo
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng Authors
CREATE TABLE authors (
    author_id INT AUTO_INCREMENT PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    biography TEXT,                               -- Tiểu sử hoặc mô tả ngắn về tác giả
    date_of_birth DATE,                           -- Ngày sinh của tác giả
    nationality VARCHAR(100),                      -- Quốc tịch
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày thêm vào hệ thống.
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Ngày cập nhật thông tin
);

-- Bảng Documents
CREATE TABLE documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    document_title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type ENUM('BOOK', 'NEWSPAPER', 'MAGAZINE', 'MAP', 'THESIS', 'REPORT') NOT NULL,
    publication_year YEAR,
    language VARCHAR(50),
    page_count INT UNSIGNED NOT NULL,
    cover_image VARCHAR(255) NULL,
    isbn VARCHAR(20),
    document_status ENUM('AVAILABLE', 'RESERVED', 'BORROWED', 'LOST', 'DAMAGED') DEFAULT 'AVAILABLE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes TEXT
);

-- Bảng Document_items
CREATE TABLE document_items (
    document_item_id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    shelf_location VARCHAR(100),
    acquisition_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    condition_status ENUM('GOOD', 'DAMAGED', 'LOST') DEFAULT 'GOOD',
    availability_status ENUM('AVAILABLE', 'BORROWED', 'RESERVED', 'LOST') DEFAULT 'AVAILABLE',
    is_reference_only BOOLEAN DEFAULT FALSE,
    notes TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
);

-- Bảng Reservations
CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,         -- Khóa chính, định danh phiếu đặt giữ
    account_id INT NOT NULL,                                -- Người đặt giữ (tham chiếu tới bảng accounts)
    reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,    -- Ngày tạo phiếu đặt giữ
    expiration_date DATETIME NOT NULL,                      -- Ngày hết hạn phiếu đặt giữ (ví dụ: 2-3 ngày)
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'COMPLETED') DEFAULT 'ACTIVE',  -- Trạng thái phiếu đặt giữ
    notes TEXT,                                             -- Ghi chú thêm (nếu có)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,          -- Ngày tạo bản ghi (thông thường giống reservation_date)
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);


-- Bảng Borrowings
CREATE TABLE borrowings (
    borrowing_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,                                       -- Người mượn tài liệu
    reservation_id INT DEFAULT NULL,                               -- Tham chiếu đến phiếu đặt giữ (nếu có)
    borrowing_date DATETIME NOT NULL,                              -- Ngày mượn tài liệu
    due_date DATETIME NOT NULL,                                    -- Ngày phải trả
    status ENUM('BORROWED', 'RETURNED', 'OVERDUE') DEFAULT 'BORROWED',  -- Trạng thái phiếu mượn
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,                       -- Tiền phạt (nếu có)
    returned_date DATETIME DEFAULT NULL,                           -- Ngày trả (nếu đã trả)
    notes TEXT,                                                    -- Ghi chú (nếu có)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,                 -- Ngày tạo phiếu mượn
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_renewal_date DATETIME DEFAULT NULL,                 -- Lần gia hạn cuối cùng
	total_renewals INT DEFAULT 0,                            -- Tổng số lần gia hạn đã thực hiện
	document_count INT DEFAULT 0,                            -- Tổng số tài liệu trong lần mượn này
	borrow_method ENUM('DIRECT', 'RESERVATION') DEFAULT 'DIRECT', -- Phương thức mượn
    FOREIGN KEY (account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id) ON DELETE CASCADE
);

-- Bảng Returns
CREATE TABLE returns (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    borrowing_id INT NOT NULL,                                    			-- Tham chiếu đến phiếu mượn
    return_date DATETIME NOT NULL,                                			-- Ngày trả tài liệu
    late_days INT DEFAULT 0,                                      			-- Số ngày trả trễ (nếu có)
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,                      			-- Số tiền phạt
    status ENUM('ON_TIME', 'LATE', 'DAMAGED', 'LOST') DEFAULT 'ON_TIME',
    processed_by INT DEFAULT NULL,                          	  			-- Người xử lý phiếu trả
	reason_late TEXT DEFAULT NULL,                                			-- Lý do trả muộn (nếu có)
    notes TEXT,                                                   			-- Ghi chú (nếu có)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,                			-- Ngày tạo phiếu trả
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (borrowing_id) REFERENCES borrowings(borrowing_id) ON DELETE CASCADE
);

-- Bảng Renewals
CREATE TABLE renewals (
    renewal_id INT AUTO_INCREMENT PRIMARY KEY,
    borrowing_id INT NOT NULL,                                      -- Tham chiếu đến phiếu mượn cần gia hạn
    account_id INT NOT NULL,                                        -- Người thực hiện gia hạn
    renewal_date DATETIME DEFAULT CURRENT_TIMESTAMP,                -- Ngày thực hiện gia hạn
    new_due_date DATETIME NOT NULL,                                 -- Ngày phải trả mới sau khi gia hạn
    status ENUM('APPROVED', 'REJECTED') DEFAULT 'APPROVED', 		-- Trạng thái của lần gia hạn
    reason TEXT,                                                    -- Lý do gia hạn (nếu có)
    notes TEXT,                                                     -- Ghi chú thêm
    FOREIGN KEY (borrowing_id) REFERENCES borrowings(borrowing_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);


-- Bảng Violations
CREATE TABLE violations (
    violation_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,                                     -- Người vi phạm
    borrowing_id INT DEFAULT NULL,                               -- Phiếu mượn liên quan (nếu có)
    return_id INT DEFAULT NULL,                                  -- Phiếu trả liên quan (nếu có)
    renewal_id INT DEFAULT NULL,                                 -- Phiếu gia hạn liên quan (nếu có)
    violation_date DATETIME DEFAULT CURRENT_TIMESTAMP,           -- Ngày phát sinh vi phạm
    description TEXT NOT NULL,                                   -- Mô tả vi phạm
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,                     -- Số tiền phạt (nếu có)
    status ENUM('PENDING', 'PAID', 'WAIVED') DEFAULT 'PENDING',  -- Trạng thái vi phạm
    notes TEXT,                                                  -- Ghi chú thêm
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
    FOREIGN KEY (borrowing_id) REFERENCES borrowings(borrowing_id) ON DELETE CASCADE,
    FOREIGN KEY (return_id) REFERENCES returns(return_id) ON DELETE CASCADE,
    FOREIGN KEY (renewal_id) REFERENCES renewals(renewal_id) ON DELETE CASCADE
);


-- Bảng Payments
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,                                        -- Người thực hiện thanh toán
    card_id INT,
    reservation_id INT DEFAULT NULL,                                -- Tham chiếu đến phiếu đặt giữ (nếu có)
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,                -- Ngày thực hiện thanh toán
    amount DECIMAL(10,2) NOT NULL,                                  -- Số tiền thanh toán
    method ENUM('CASH', 'CREDIT_CARD', 'BANK_TRANSFER') DEFAULT 'CASH', -- Phương thức thanh toán
    status ENUM('COMPLETED', 'FAILED') DEFAULT 'COMPLETED',    -- Trạng thái thanh toán
    notes TEXT,                                                     -- Ghi chú thêm (nếu có)
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id) ON DELETE CASCADE
);

-- Bảng Notifications
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,        -- ID thông báo
    title VARCHAR(255) NOT NULL,                            -- Tiêu đề thông báo
    content TEXT NOT NULL,                                  -- Nội dung thông báo
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,             -- Thời gian gửi
    borrowing_id INT DEFAULT NULL,                           -- Liên kết đến phiếu mượn (nếu có)
    return_id INT DEFAULT NULL,                              -- Liên kết đến phiếu trả (nếu có)
    payment_id INT DEFAULT NULL,                             -- Liên kết đến thanh toán (nếu có)
    renewal_id INT DEFAULT NULL,                             -- Liên kết đến gia hạn (nếu có)
    reservation_id INT DEFAULT NULL,                         -- Liên kết đến phiếu đặt giữ (nếu có)
    send_to_all BOOLEAN DEFAULT FALSE,                       -- Cờ gửi cho tất cả người dùng
    notes TEXT,                                             -- Ghi chú thêm (nếu có)
    FOREIGN KEY (borrowing_id) REFERENCES borrowings(borrowing_id) ON DELETE CASCADE,
    FOREIGN KEY (return_id) REFERENCES returns(return_id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (renewal_id) REFERENCES renewals(renewal_id) ON DELETE CASCADE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id) ON DELETE CASCADE
);


-- Bảng Statistics
CREATE TABLE statistics (
    statistic_id INT AUTO_INCREMENT PRIMARY KEY,   -- ID thống kê
    created_by_id INT NOT NULL,                     -- Người tạo thống kê (tham chiếu tài khoản)
    start_date DATETIME NOT NULL,                   -- Ngày bắt đầu thống kê
    end_date DATETIME NOT NULL,                     -- Ngày kết thúc thống kê
    total_borrowings INT DEFAULT 0,                 -- Tổng số lượt mượn trong khoảng thời gian
    total_returns INT DEFAULT 0,                     -- Tổng số lượt trả trong khoảng thời gian
    total_violations INT DEFAULT 0,                  -- Tổng số vi phạm trong khoảng thời gian
    total_payments DECIMAL(10,2) DEFAULT 0.00,      -- Tổng số tiền thanh toán trong khoảng thời gian
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo bản ghi thống kê
    FOREIGN KEY (created_by_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);



-- Bảng phụ nối

-- Bảng chi tiết phiếu đặt giữ (N-N với documents)
CREATE TABLE reservation_details (
    reservation_id INT,
    document_item_id INT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('RESERVED', 'AVAILABLE') DEFAULT 'RESERVED',
    PRIMARY KEY (reservation_id, document_item_id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id),
    FOREIGN KEY (document_item_id) REFERENCES document_items(document_item_id) 
);

-- Borrowings Detail (Borrowings ↔ Documents)
CREATE TABLE borrowings_detail (
    borrowing_id INT,                                                    -- Tham chiếu đến phiếu mượn
    document_item_id INT,                                                -- Tham chiếu đến tài liệu
    quantity INT DEFAULT 1,                                              -- Số lượng mượn
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,                       -- Ngày thêm vào phiếu mượn
    condition_status ENUM('GOOD', 'DAMAGED') DEFAULT 'GOOD',             -- Tình trạng tài liệu khi mượn
    due_date DATETIME DEFAULT NULL,                                      -- Ngày phải trả của tài liệu
    notes TEXT,                                                          -- Ghi chú
    PRIMARY KEY (borrowing_id, document_item_id),
    FOREIGN KEY (borrowing_id) REFERENCES borrowings(borrowing_id) ON DELETE CASCADE,
    FOREIGN KEY (document_item_id) REFERENCES document_items(document_item_id) ON DELETE CASCADE
);


-- Returns Detail (Returns ↔ Documents)
CREATE TABLE returns_detail (
    return_id INT,                                                        -- Tham chiếu đến phiếu trả
    document_item_id INT,                                                      -- Tham chiếu đến tài liệu
    quantity INT DEFAULT 1,                                               -- Số lượng trả
    status ENUM('GOOD', 'DAMAGED', 'LOST') DEFAULT 'GOOD',                -- Trạng thái tài liệu khi trả
    actual_return_date DATETIME DEFAULT NULL,                             -- Ngày trả thực tế của tài liệu
    damage_reason TEXT DEFAULT NULL,                                      -- Lý do hư hỏng hoặc mất
    notes TEXT,                                                           -- Ghi chú thêm
    PRIMARY KEY (return_id, document_item_id),
    FOREIGN KEY (return_id) REFERENCES returns(return_id) ON DELETE CASCADE,
    FOREIGN KEY (document_item_id) REFERENCES document_items(document_item_id) ON DELETE CASCADE
);


-- Categories Detail (Categories ↔ Documents)
CREATE TABLE categories_detail (
    document_id INT,
    category_id INT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, 
    PRIMARY KEY (document_id, category_id),
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Documents ↔ Publishers
CREATE TABLE publishers_detail (
    document_id INT,
    publisher_id INT,
    edition INT DEFAULT 1,                                     -- Lần tái bản (1st Edition, 2nd Edition, ...)
    publish_date DATE,                                         -- Ngày xuất bản
    isbn VARCHAR(20),                                          -- ISBN cho phiên bản này
    notes TEXT, 
    PRIMARY KEY (document_id, publisher_id),
    FOREIGN KEY (document_id) REFERENCES documents(document_id)ON DELETE CASCADE,
    FOREIGN KEY (publisher_id) REFERENCES publishers(publisher_id) ON DELETE CASCADE
);

-- Authors Detail (Documents ↔ Authors)
CREATE TABLE authors_detail (
    document_id INT,
    author_id INT,
    role ENUM('AUTHOR', 'EDITOR', 'ORGANIZATION', 'TRANSLATOR') DEFAULT 'AUTHOR',  -- Vai trò của tác giả trong tài liệu
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    PRIMARY KEY (document_id, author_id),
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
);



-- Notifications Detail (Notifications ↔ Accounts)
CREATE TABLE notifications_detail (
    notification_id INT NOT NULL,                  -- ID thông báo
    account_id INT NOT NULL,                       -- ID tài khoản nhận thông báo
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP, -- Thời điểm gửi/ghi nhận thông báo cho tài khoản
    status ENUM('UNREAD', 'READ') DEFAULT 'UNREAD', -- Trạng thái thông báo với người dùng (chưa đọc, đã đọc)
    PRIMARY KEY (notification_id, account_id),    -- Khóa chính kết hợp 2 trường để tránh trùng lặp
    FOREIGN KEY (notification_id) REFERENCES notifications(notification_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);


-- Bảng Notifications_Violations (N-N)
CREATE TABLE notifications_violations (
    notification_id INT NOT NULL,
    violation_id INT NOT NULL,
    PRIMARY KEY (notification_id, violation_id),
    FOREIGN KEY (notification_id) REFERENCES notifications(notification_id),
    FOREIGN KEY (violation_id) REFERENCES violations(violation_id)
);

-- Payments ↔ Borrowings
CREATE TABLE payments_borrowings (
    payment_id INT,
    borrowing_id INT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    PRIMARY KEY (payment_id, borrowing_id),
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (borrowing_id) REFERENCES borrowings(borrowing_id) ON DELETE CASCADE
);

-- Payments ↔ Returns
CREATE TABLE payments_returns (
    payment_id INT,                                                       -- Tham chiếu đến thanh toán
    return_id INT,                                                        -- Tham chiếu đến phiếu trả
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,                        -- Ngày ghi nhận thanh toán
    notes TEXT,                                                           -- Ghi chú thêm nếu cần
    PRIMARY KEY (payment_id, return_id),
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (return_id) REFERENCES returns(return_id) ON DELETE CASCADE
);


-- Payments ↔ Renewals
CREATE TABLE payments_renewals (
    payment_id INT,
    renewal_id INT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    PRIMARY KEY (payment_id, renewal_id),
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (renewal_id) REFERENCES renewals(renewal_id) ON DELETE CASCADE
);

-- Payments ↔ Violations
CREATE TABLE payments_violations (
    payment_id INT,
    violation_id INT,
    amount DECIMAL(10, 2) NOT NULL,                  -- Số tiền thanh toán cho vi phạm này
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    PRIMARY KEY (payment_id, violation_id),
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (violation_id) REFERENCES violations(violation_id) ON DELETE CASCADE
);

