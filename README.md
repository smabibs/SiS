# SiS (Sistem Informasi Sekolah) Integrated Modules

A comprehensive, integrated web application built with Next.js for managing various school facilities and resources. This project unifies multiple independent management systems into a single, cohesive platform.

## 🚀 Features & Modules

The application is divided into three primary modules, each accessible after logging in:

### 1. Lab IPA (Science Laboratory Management)
- **Inventory Management**: Track laboratory equipment and supplies.
- **Borrowing System**: Manage and monitor equipment loans by students and staff.
- **Reporting**: Generate reports and statistics on lab usage and inventory.
- **Submissions**: Handle purchase or restock requests for lab materials.

### 2. E-Perpus (Library Management System)
- **Book Cataloging**: Comprehensive book management with multi-tagging, categories, and ISBN online lookup support.
- **Member Management**: Track library members (students/staff), import from Excel, and manage profile photos.
- **Circulation Management**: Handle book borrowing, returns, and digital reservations.
- **Barcode Generation**: Create and print member cards and book barcodes.

### 3. Sarpras (Facility & Infrastructure Management)
- **Asset Tracking**: Manage school facilities, rooms, and infrastructure assets.
- **Room Management**: Schedule and monitor the usage of various school rooms.
- **Loan System**: Handle requests to borrow school assets (projectors, sound systems, etc.).

## 🛠️ Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (via `better-sqlite3`)
- **Icons**: Lucide React
- **Reports**: ExcelJS (for exporting system reports to Excel)
- **Barcodes**: JsBarcode

---

## 💻 Local Development Setup

To run this application locally on your machine for development or testing:

### Prerequisites
- Node.js (v18 or higher recommended)
- Git

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/smabibs/SiS.git
   cd SiS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory (if needed) to configure app secrets, authentication tokens, or WhatsApp notification API tokens.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`.

---

## 🌍 Production Deployment Guide

To deploy this application to a live server (e.g., a Linux VPS running Ubuntu), follow these steps:

### 1. Prepare the Server
Ensure your server has Node.js and PM2 installed.
```bash
# Install Node.js (using NodeSource snippet for Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally to keep the app running in the background
sudo npm install -g pm2
```

### 2. Clone and Build the Application
On your server, clone the repository and build the production version of the Next.js app.

```bash
git clone https://github.com/smabibs/SiS.git
cd SiS

# Install dependencies
npm install

# Build the optimized production application
npm run build
```

### 3. Start the Application with PM2
Use PM2 to start the application and ensure it restarts if the server reboots.

```bash
# Start the Next.js production server
pm2 start npm --name "sis-app" -- start

# Save the PM2 process list so it automatically restarts on server reboot
pm2 save
pm2 startup
```

### 4. Set Up a Reverse Proxy (Nginx)
To serve the application on standard HTTP/HTTPS ports (80/443) and optionally attach a custom domain name, install and configure Nginx.

```bash
sudo apt-get install nginx
```

Create an Nginx configuration file for your app:
```bash
sudo nano /etc/nginx/sites-available/sis-app
```

Add the following configuration (replace `your_domain_or_IP`):
```nginx
server {
    listen 80;
    server_name your_domain_or_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and restart Nginx:
```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/sis-app /etc/nginx/sites-enabled/

# Test the Nginx configuration for syntax errors
sudo nginx -t

# Restart Nginx to apply changes
sudo systemctl restart nginx
```

Your application should now be live and accessible via your server's IP address or domain name!
