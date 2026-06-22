const GarmentSize =
require("../model/GarmentSize");

exports.createSize = async(req,res)=>{
try{

const size =
await GarmentSize.create(req.body);

res.status(201).json({
success:true,
data:size
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getSizes = async(req,res)=>{
try{

const sizes =
await GarmentSize.find();

res.json({
success:true,
data:sizes
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getSizeById = async(req,res)=>{
try{

const size =
await GarmentSize.findById(req.params.id);

res.json({
success:true,
data:size
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.updateSize = async(req,res)=>{
try{

const size =
await GarmentSize.findByIdAndUpdate(
req.params.id,
req.body,
{
new:true
}
);

res.json({
success:true,
data:size
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.deleteSize = async(req,res)=>{
try{

await GarmentSize.findByIdAndDelete(
req.params.id
);

res.json({
success:true,
message:"Size deleted"
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};