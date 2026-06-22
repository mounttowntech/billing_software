const GarmentCustomer = require("../model/GarmentCustomer");

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
*/
exports.createCustomer = async (req, res) => {
  try {
    const { customerCode, customerName, phone, email } = req.body;

    const existingCustomer = await GarmentCustomer.findOne({
      $or: [{ customerCode }, { phone }],
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer already exists",
      });
    }

    const customer = await GarmentCustomer.create(req.body);

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Customers
|--------------------------------------------------------------------------
*/
exports.getCustomers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const query = {
      customerName: {
        $regex: search,
        $options: "i",
      },
    };

    const total = await GarmentCustomer.countDocuments(query);

    const customers = await GarmentCustomer.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total,
      page,
      limit,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await GarmentCustomer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await GarmentCustomer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await GarmentCustomer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
