# Azure three-tier INFRASTRUCTURE lab: web -> app -> database.
# No application/database packages are installed by this configuration.
# Set ARM_SUBSCRIPTION_ID and authenticate with az login before running.
# Generate ~/.ssh/azure-three-tier.pub with ssh-keygen before applying.
# Replace 203.0.113.10/32 below with YOUR public IPv4 address/32.
# HTTP-only lab. Add TLS, HA, backups and monitoring for production.

terraform {
  required_version = ">= 1.6.0, < 2.0.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.66.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "rg-three-tier-demo"
  location = "East US"
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-three-tier"
  address_space       = ["10.20.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_subnet" "web" {
  name                            = "snet-web"
  resource_group_name             = azurerm_resource_group.main.name
  virtual_network_name            = azurerm_virtual_network.main.name
  address_prefixes                = ["10.20.1.0/24"]
  default_outbound_access_enabled = false
}

resource "azurerm_subnet" "app" {
  name                            = "snet-app"
  resource_group_name             = azurerm_resource_group.main.name
  virtual_network_name            = azurerm_virtual_network.main.name
  address_prefixes                = ["10.20.2.0/24"]
  default_outbound_access_enabled = false
}

resource "azurerm_subnet" "db" {
  name                            = "snet-db"
  resource_group_name             = azurerm_resource_group.main.name
  virtual_network_name            = azurerm_virtual_network.main.name
  address_prefixes                = ["10.20.3.0/24"]
  default_outbound_access_enabled = false
}

resource "azurerm_network_security_group" "web" {
  name                = "nsg-web"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                        = "Allow-Tier-Service"
    priority                    = 100
    direction                   = "Inbound"
    access                      = "Allow"
    protocol                    = "Tcp"
    source_port_range           = "*"
    destination_port_range      = "80"
    source_address_prefix       = "Internet"
    destination_address_prefix  = "*"
  }

  security_rule {
    name                        = "Allow-SSH-Administration"
    priority                    = 110
    direction                   = "Inbound"
    access                      = "Allow"
    protocol                    = "Tcp"
    source_port_range           = "*"
    destination_port_range      = "22"
    source_address_prefix       = "203.0.113.10/32"
    destination_address_prefix  = "*"
  }

  security_rule {
    name                        = "Deny-All-Other-Inbound"
    priority                    = 4000
    direction                   = "Inbound"
    access                      = "Deny"
    protocol                    = "*"
    source_port_range           = "*"
    destination_port_range      = "*"
    source_address_prefix       = "*"
    destination_address_prefix  = "*"
  }
}

resource "azurerm_network_security_group" "app" {
  name                = "nsg-app"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                        = "Allow-Tier-Service"
    priority                    = 100
    direction                   = "Inbound"
    access                      = "Allow"
    protocol                    = "Tcp"
    source_port_range           = "*"
    destination_port_range      = "8080"
    source_address_prefix       = "10.20.1.0/24"
    destination_address_prefix  = "*"
  }

  security_rule {
    name                        = "Allow-SSH-Administration"
    priority                    = 110
    direction                   = "Inbound"
    access                      = "Allow"
    protocol                    = "Tcp"
    source_port_range           = "*"
    destination_port_range      = "22"
    source_address_prefix       = "10.20.1.10/32"
    destination_address_prefix  = "*"
  }

  security_rule {
    name                        = "Deny-All-Other-Inbound"
    priority                    = 4000
    direction                   = "Inbound"
    access                      = "Deny"
    protocol                    = "*"
    source_port_range           = "*"
    destination_port_range      = "*"
    source_address_prefix       = "*"
    destination_address_prefix  = "*"
  }
}

resource "azurerm_network_security_group" "db" {
  name                = "nsg-db"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                        = "Allow-Tier-Service"
    priority                    = 100
    direction                   = "Inbound"
    access                      = "Allow"
    protocol                    = "Tcp"
    source_port_range           = "*"
    destination_port_range      = "5432"
    source_address_prefix       = "10.20.2.0/24"
    destination_address_prefix  = "*"
  }

  security_rule {
    name                        = "Allow-SSH-Administration"
    priority                    = 110
    direction                   = "Inbound"
    access                      = "Allow"
    protocol                    = "Tcp"
    source_port_range           = "*"
    destination_port_range      = "22"
    source_address_prefix       = "10.20.1.10/32"
    destination_address_prefix  = "*"
  }

  security_rule {
    name                        = "Deny-All-Other-Inbound"
    priority                    = 4000
    direction                   = "Inbound"
    access                      = "Deny"
    protocol                    = "*"
    source_port_range           = "*"
    destination_port_range      = "*"
    source_address_prefix       = "*"
    destination_address_prefix  = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "web" {
  subnet_id                 = azurerm_subnet.web.id
  network_security_group_id = azurerm_network_security_group.web.id
}

resource "azurerm_subnet_network_security_group_association" "app" {
  subnet_id                 = azurerm_subnet.app.id
  network_security_group_id = azurerm_network_security_group.app.id
}

resource "azurerm_subnet_network_security_group_association" "db" {
  subnet_id                 = azurerm_subnet.db.id
  network_security_group_id = azurerm_network_security_group.db.id
}

resource "azurerm_public_ip" "web" {
  name                = "pip-web"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_public_ip" "nat" {
  name                = "pip-nat"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_nat_gateway" "main" {
  name                    = "nat-three-tier"
  location                = azurerm_resource_group.main.location
  resource_group_name     = azurerm_resource_group.main.name
  sku_name                = "Standard"
  idle_timeout_in_minutes = 10
}

resource "azurerm_nat_gateway_public_ip_association" "main" {
  nat_gateway_id       = azurerm_nat_gateway.main.id
  public_ip_address_id = azurerm_public_ip.nat.id
}

resource "azurerm_subnet_nat_gateway_association" "web" {
  subnet_id      = azurerm_subnet.web.id
  nat_gateway_id = azurerm_nat_gateway.main.id
}

resource "azurerm_subnet_nat_gateway_association" "app" {
  subnet_id      = azurerm_subnet.app.id
  nat_gateway_id = azurerm_nat_gateway.main.id
}

resource "azurerm_subnet_nat_gateway_association" "db" {
  subnet_id      = azurerm_subnet.db.id
  nat_gateway_id = azurerm_nat_gateway.main.id
}

resource "azurerm_network_interface" "web" {
  name                = "nic-web"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.web.id
    private_ip_address_allocation = "Static"
    private_ip_address            = "10.20.1.10"
    public_ip_address_id          = azurerm_public_ip.web.id
  }
}

resource "azurerm_network_interface" "app" {
  name                = "nic-app"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.app.id
    private_ip_address_allocation = "Static"
    private_ip_address            = "10.20.2.10"

  }
}

resource "azurerm_network_interface" "db" {
  name                = "nic-db"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.db.id
    private_ip_address_allocation = "Static"
    private_ip_address            = "10.20.3.10"

  }
}

resource "azurerm_linux_virtual_machine" "web" {
  name                            = "vm-web"
  location                        = azurerm_resource_group.main.location
  resource_group_name             = azurerm_resource_group.main.name
  size                            = "Standard_D2s_v3"
  admin_username                  = "azureuser"
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.web.id]
  admin_ssh_key {
    username   = "azureuser"
    public_key = file(pathexpand("~/.ssh/azure-three-tier.pub"))
  }
  os_disk {
    name                 = "osdisk-web"
    caching              = "ReadWrite"
    storage_account_type = "StandardSSD_LRS"
    disk_size_gb         = 30
  }
  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }
  depends_on = [
    azurerm_subnet_network_security_group_association.web,
    azurerm_subnet_nat_gateway_association.web,
    azurerm_nat_gateway_public_ip_association.main
  ]
}

resource "azurerm_linux_virtual_machine" "app" {
  name                            = "vm-app"
  location                        = azurerm_resource_group.main.location
  resource_group_name             = azurerm_resource_group.main.name
  size                            = "Standard_D2s_v3"
  admin_username                  = "azureuser"
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.app.id]
  admin_ssh_key {
    username   = "azureuser"
    public_key = file(pathexpand("~/.ssh/azure-three-tier.pub"))
  }
  os_disk {
    name                 = "osdisk-app"
    caching              = "ReadWrite"
    storage_account_type = "StandardSSD_LRS"
    disk_size_gb         = 30
  }
  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }
  depends_on = [
    azurerm_subnet_network_security_group_association.app,
    azurerm_subnet_nat_gateway_association.app,
    azurerm_nat_gateway_public_ip_association.main
  ]
}

resource "azurerm_linux_virtual_machine" "db" {
  name                            = "vm-db"
  location                        = azurerm_resource_group.main.location
  resource_group_name             = azurerm_resource_group.main.name
  size                            = "Standard_D2s_v3"
  admin_username                  = "azureuser"
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.db.id]
  admin_ssh_key {
    username   = "azureuser"
    public_key = file(pathexpand("~/.ssh/azure-three-tier.pub"))
  }
  os_disk {
    name                 = "osdisk-db"
    caching              = "ReadWrite"
    storage_account_type = "StandardSSD_LRS"
    disk_size_gb         = 30
  }
  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }
  depends_on = [
    azurerm_subnet_network_security_group_association.db,
    azurerm_subnet_nat_gateway_association.db,
    azurerm_nat_gateway_public_ip_association.main
  ]
}

# Separate persistent data disk; mount it before configuring PostgreSQL storage.
resource "azurerm_managed_disk" "db_data" {
  name                 = "disk-db-data"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  storage_account_type = "StandardSSD_LRS"
  create_option        = "Empty"
  disk_size_gb         = 32
}

resource "azurerm_virtual_machine_data_disk_attachment" "db" {
  managed_disk_id     = azurerm_managed_disk.db_data.id
  virtual_machine_id = azurerm_linux_virtual_machine.db.id
  lun                = 0
  caching            = "None"
}

output "web_public_ip" {
  value = azurerm_public_ip.web.ip_address
}

output "private_ips" {
  value = {
    web = azurerm_network_interface.web.private_ip_address
    app = azurerm_network_interface.app.private_ip_address
    db  = azurerm_network_interface.db.private_ip_address
  }
}

output "resource_group" {
  value = azurerm_resource_group.main.name
}
