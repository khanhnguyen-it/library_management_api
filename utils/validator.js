const validateRequired = (fields, body) => {
    const missing = [];
    fields.forEach(field => {
        if (!body[field]) missing.push(field);
    });
    return missing;
};

const validateEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
};

module.exports = {
    validateRequired,
    validateEmail
};