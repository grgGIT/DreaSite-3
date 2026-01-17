const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const express = require('express')
const nodemailer = require('nodemailer')
const app = express()
const port = process.env.PORT || 3000

// Middleware to parse JSON
app.use(express.json())

// Serve static files for the website
app.use(express.static(path.join(__dirname, '../front')))

// Root serves the website homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/index.html'))
})

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body || {}

    // Validate payload
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' })
    }

    // Create a secure transporter using environment variables
    // Supported providers: any SMTP server (Gmail, Outlook, custom). Do NOT hardcode secrets.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Verify transporter configuration (optional but helpful)
    await transporter.verify()

    const toAddress = process.env.CONTACT_TO || process.env.SMTP_USER

    const info = await transporter.sendMail({
      from: `Drea’s Place Contact <${process.env.SMTP_USER}>`,
      to: toAddress,
      subject: `New message from ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    })

    return res.json({ ok: true, id: info.messageId })
  } catch (err) {
    console.error('Contact form error:', err)
    return res.status(500).json({ ok: false, error: 'Failed to send message' })
  }
})

app.listen(port, () => console.log(`Server listening on port ${port}`))