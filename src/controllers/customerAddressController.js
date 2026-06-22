const CustomerAddress =
require("../model/CustomerAddress");

exports.createAddress = async(req,res)=>{
try{

const address =
await CustomerAddress.create(
req.body
);

res.status(201).json({
success:true,
data:address
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getAddresses = async(req,res)=>{
try{

const addresses =
await CustomerAddress.find()
.populate(
"customer",
"customerName phone"
);

res.json({
success:true,
data:addresses
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getAddressById = async(req,res)=>{
try{

const address =
await CustomerAddress.findById(
req.params.id
).populate(
"customer",
"customerName phone"
);

res.json({
success:true,
data:address
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.updateAddress = async(req,res)=>{
try{

const address =
await CustomerAddress.findByIdAndUpdate(
req.params.id,
req.body,
{
new:true
}
);

res.json({
success:true,
data:address
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.deleteAddress = async(req,res)=>{
try{

await CustomerAddress.findByIdAndDelete(
req.params.id
);

res.json({
success:true,
message:"Address deleted"
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};