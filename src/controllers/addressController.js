import { logger } from "../../app.js";
import IDValidator from "../utils/IDValidator.js";

// Dynamically import the appropriate model based on DB_TYPE
let AddressModel;
try {
  if (process.env.DB_TYPE === "mongo") {
    AddressModel = (await import("../models/AddressMongo.js")).default;
  } else if (process.env.DB_TYPE === "mysql") {
    AddressModel = (await import("../models/AddressMysql.js")).default;
  } else {
    throw new Error("Invalid DB_TYPE in .env file. Must be 'mongo' or 'mysql'.");
  }
} catch (error) {
  console.log("Error loading address model:", error);
  throw new Error("Failed to load address model");
}

class AddressController {
  constructor() {
    this.create = this.create.bind(this);
    this.getByUserId = this.getByUserId.bind(this);
    this.getUserAddresses = this.getUserAddresses.bind(this);
    this.getAddressById = this.getAddressById.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(req, res) {
    try {
      const { userId, street, number, complement, neighborhood, city, state, zipCode, country } = req.body;

      IDValidator.validateFields(
        { userId, street, number, neighborhood, city, state, zipCode },
        { required: true }
      );

      const newAddress = { userId, street, number, complement, neighborhood, city, state, zipCode, country };
      const createdAddress = await AddressModel.create(newAddress);
      return res.status(201).json(createdAddress);
    } catch (error) {
      logger.error("Error creating address:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  async getByUserId(req, res) {
    try {
      const userId = req.user.role === 'Admin' ? req.params.userId || req.body.userId : req.user.id;
      const addresses = await AddressModel.findAll({ where: { userId } });
      if (!addresses.length) {
        return res.status(404).json({ message: "No addresses found for this user." });
      }
      return res.status(200).json(addresses);
    } catch (error) {
      logger.error("Error fetching addresses:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  async getUserAddresses(req, res) {
    try {
      const addresses = await AddressModel.findAll();
      return res.status(200).json(addresses);
    } catch (error) {
      logger.error("Error fetching all user addresses:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  async getAddressById(req, res) {
    try {
      const id = req.params.addressId || req.body.addressId 
      const address = await AddressModel.findByPk(id);
      if (!address) {
        return res.status(404).json({ error: "Address not found." });
      }
      return res.status(200).json(address);
    } catch (error) {
      logger.error("Error fetching address by ID:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }


  async setPrimaryAddress(req, res) {
    try {
      const userId =  req.params.userId || req.body.userId
      const addressId =  req.params.addressId || req.body.addressId
      await AddressModel.update({ isPrimary: false }, { where: { userId } });
      await AddressModel.update({ isPrimary: true }, { where: { id: addressId, userId } });
      return res.status(200).json({ message: "Primary address updated successfully." });
    } catch (error) {
      logger.error("Error setting primary address:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  async getPrimaryAddress(req, res) {
    try {
      const userId  = req.params.userId || req.body.userId;
      const address = await AddressModel.findOne({ where: { userId, isPrimary: true } });
      if (!address) {
        return res.status(404).json({ error: "Primary address not found." });
      }
      return res.status(200).json(address);
    } catch (error) {
      logger.error("Error fetching primary address:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }



  async update(req, res) {
    try {
      const id = req.params.addressId || req.body.addressId
      const updatedData = req.body;

      const address = await AddressModel.findByPk(id);
      if (!address) {
        return res.status(404).json({ error: "Address not found." });
      }

      await address.update(updatedData);
      return res.status(200).json(address);
    } catch (error) {
      logger.error("Error updating address:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  async delete(req, res) {
    try {
      const id = req.params.addressId || req.body.addressId 
      const address = await AddressModel.findByPk(id);
      if (!address) {
        return res.status(404).json({ error: "Address not found." });
      }

      await address.destroy();
      return res.status(200).json({ message: "Address deleted successfully." });
    } catch (error) {
      logger.error("Error deleting address:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
}

export default new AddressController();
