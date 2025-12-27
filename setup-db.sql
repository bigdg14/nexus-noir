-- Create user and database for social network
CREATE USER social_admin WITH PASSWORD 'SocialAdminStrongP@ssw0rd';
CREATE DATABASE social_network OWNER social_admin;
GRANT ALL PRIVILEGES ON DATABASE social_network TO social_admin;
