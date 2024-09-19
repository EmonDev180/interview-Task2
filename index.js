const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const axios = require('axios');
const port = process.env.PORT || 3000;
const dbConfig = {
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "database_schema"                           
};

//middlewere
app.use(express.json())

app.post('/generate-report', async (req, res) => {

    const connection = await mysql.createConnection(dbConfig);

    try {
        const response = await axios.get('https://raw.githubusercontent.com/Bit-Code-Technologies/mockapi/main/purchase.json');
        const data = response.data;
        console.log(data)

        // Begin transaction
        await connection.beginTransaction();

        // Clear existing data
        await connection.query('DELETE FROM Purchase_History');
        await connection.query('DELETE FROM Users');
        await connection.query('DELETE FROM Products');

        // Insert new data
        const userQueries = data.users.map(user => connection.query('INSERT INTO Users (user_id, name, email) VALUES (?, ?, ?)', [user.id, user.name, user.email]));
        const productQueries = data.products.map(product => connection.query('INSERT INTO Products (product_id, name, price) VALUES (?, ?, ?)', [product.id, product.name, product.price]));
        const purchaseQueries = data.purchases.map(purchase => connection.query('INSERT INTO Purchase_History (purchase_id, user_id, product_id, quantity, total_amount) VALUES (?, ?, ?, ?, ?)', [purchase.id, purchase.userId, purchase.productId, purchase.quantity, purchase.totalAmount]));

        await Promise.all([...userQueries, ...productQueries, ...purchaseQueries]);

        // Commit transaction
        await connection.commitTransaction();
        res.send('Data has been successfully updated.');
    } catch (error) {
        console.error('Error fetching or storing data:', error);
        await connection.rollbackTransaction();
        res.status(500).send('Error fetching or storing data.');
    } finally {
        await connection.end();
    }
});

app.get('/', (req, res) => {
    res.send('mysql is running')
})

app.listen(port, () => {

    console.log(`mysql  is running on port ${port}`)

})