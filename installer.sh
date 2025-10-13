#!/bin/bash
# --------------------------------------------
# Instalador automático del backend GeoSchools
# --------------------------------------------

# Variables configurables
REPO_URL="https://github.com/hrodriguezhenry/geoschoolsbackend.git"
APP_DIR="/var/www/geoschools/backend"
DOMAIN="geoschools.online"
NODE_VERSION="20"

# Actualizar el sistema
echo "🟢 Actualizando paquetes..."
sudo apt update -y && sudo apt upgrade -y

# Instalar MySQL
echo "🟢 Instalando MySQL..."
sudo apt install mysql-server -y
sudo systemctl enable mysql
sudo systemctl start mysql

# Configurar MySQL para conexiones remotas (si aplica)
echo "🟢 Configurando MySQL..."
sudo sed -i "s/^bind-address.*/bind-address = 0.0.0.0/" /etc/mysql/mysql.conf.d/mysqld.cnf
sudo systemctl restart mysql

# Instalar Node.js y npm
echo "🟢 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
echo "🟢 Instalando PM2..."
sudo npm install -g pm2

# Clonar el repositorio del backend
echo "🟢 Clonando repositorio desde GitHub..."
sudo mkdir -p /var/www/geoschools
cd /var/www/geoschools
sudo git clone $REPO_URL backend
cd backend

# Instalar dependencias
echo "🟢 Instalando dependencias de Node.js..."
npm install

# Iniciar aplicación con PM2
echo "🟢 Iniciando backend con PM2..."
pm2 start src/server.js --name geoschools-api
pm2 save
pm2 startup systemd -u azureuser --hp /home/azureuser

# Instalar y configurar Nginx
echo "🟢 Instalando Nginx..."
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# Crear archivo de configuración de Nginx
echo "🟢 Creando configuración de Nginx..."
sudo tee /etc/nginx/sites-available/geoschools > /dev/null <<EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Activar el sitio
sudo ln -sf /etc/nginx/sites-available/geoschools /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Instalar Certbot para HTTPS
echo "🟢 Instalando Certbot..."
sudo apt install certbot python3-certbot-nginx -y

# Generar certificado SSL (manual: solo si el dominio apunta correctamente)
echo "🟢 Generando certificados SSL con Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

# Limpieza
echo "🟢 Limpieza final..."
sudo apt autoremove -y

# Información final
echo "✅ Instalación completa. Backend disponible en https://$DOMAIN"
echo "Para revisar logs: pm2 logs geoschools-api"
