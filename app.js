const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "postgres",
  database: "node",
  port: 5432,
});

const secretKey = "your_secret_key";

// Register endpoint (for reference)
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, city, district, state } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (name, email, password, phone, address, city, district, state)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [name, email, hashedPassword, phone, address, city, district, state];
    const result = await pool.query(query, values);

    res.status(201).json({ success: true, message: "User registered successfully", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get('/users',async(req, res)=>{
    try{
        const query = `SELECT * FROM users;`;
        const result = await pool.query(query);
        res.status(200).json({success:true,users:result.rows});
    }catch(error){
        res.status(500).json({success:false,message:"Internal server error"})
    }
});

app.get('/user/id',async(req,res)=>{
    try{
        const query = `SELECT * FROM users WHERE id=$1;`
        const values = [req.params.id];
        const result = await pool.query(query,values);
        res.status(200).json({success:true,user:result.rows[0]});
    }catch(error){
        res.status(500).json({success:false,message:"Internal server error"})
    }
})

app.put('/edituser/id',async(req,res)=>{
    try{
        const {id,name,email,password,phone,address,city,district,state} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `UPDATE users SET name=$1,email=$2,password=$3,phone=$
        4,address=$5,city=$6,district=$7,state=$8 WHERE id=$
        9 RETURNING *;`
        const values = [name,email,hashedPassword,phone,address,city,district,state,id];
        const result = await pool.query(query,values);
        res.status(200).json({success:true,message:"User updated successfully",user:result.rows[
            0]});
    }catch(error){
        res.status(500).json({success:false,message:"Internal server error"})
    }
})

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, secretKey, { expiresIn: '1h' });

    res.status(200).json({ success: true, message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
