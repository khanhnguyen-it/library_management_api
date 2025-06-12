// utils/emailService.js
const sendMail = async (to, subject, text, html) => {
    console.log("📨 Email To:", to);
    console.log("📨 Subject:", subject);
    console.log("📨 Text:", text);
};

module.exports = { sendMail };


