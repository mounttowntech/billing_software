const TaxSetting = require("../model/TaxSetting");

exports.createTax = async (req, res) => {
  try {
    const tax = await TaxSetting.create(req.body);

    res.status(201).json({
      success: true,
      data: tax,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTaxes = async (req, res) => {
  try {
    const taxes = await TaxSetting.find();

    res.json({
      success: true,
      data: taxes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTaxById = async (req, res) => {
  try {
    const tax = await TaxSetting.findById(req.params.id);

    res.json({
      success: true,
      data: tax,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateTax = async (req, res) => {
  try {
    const tax = await TaxSetting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({
      success: true,
      data: tax,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteTax = async (req, res) => {
  try {
    await TaxSetting.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Tax deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
