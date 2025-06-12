const success = (res, data, message = "Thành công") => {
    res.status(200).json({ status: "success", message, data });
};

const created = (res, data, message = "Tạo mới thành công") => {
    res.status(201).json({ status: "success", message, data });
};

const error = (res, statusCode = 500, message = "Có lỗi xảy ra") => {
    res.status(statusCode).json({ status: "error", message });
};

module.exports = { success, created, error };