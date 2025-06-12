require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRouter = require('./routers/authRouter');
const documentRouter = require('./routers/documentRouter');
const documentItemRouter = require('./routers/documentItemRouter');
const borrowRouter = require('./routers/borrowRouter');
const reservationRouter = require('./routers/reservationRouter');
const returnRouter = require('./routers/returnRouter');
const renewalRouter = require('./routers/renewalRouter');
const violationRouter = require('./routers/violationRouter');
const paymentRouter = require('./routers/paymentRouter');
const notificationRouter = require('./routers/notificationRouter');
const statisticRouter = require('./routers/statisticRouter');
const authorRouter = require('./routers/authorRouter');
const categoryRouter = require('./routers/categoryRouter');
const publisherRouter = require('./routers/publisherRouter');
const userRouter = require('./routers/userRouter');
const cardRouter = require('./routers/cardRouter');
const roleRouter = require('./routers/roleRouter');


const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/documents', documentRouter);
app.use('/api/document-items', documentItemRouter);
app.use('/api/borrowings', borrowRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/returns', returnRouter);
app.use('/api/renewals', renewalRouter);
app.use('/api/violations', violationRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/statistics', statisticRouter);
app.use('/api/authors', authorRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/publishers', publisherRouter);
app.use('/api/users', userRouter);
app.use('/api/cards', cardRouter);
app.use('/api/roles', roleRouter);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
