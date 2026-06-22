const GarmentFabric =
require("../model/GarmentFabric");

exports.createFabric = async(req,res)=>{
try{

const fabric =
await GarmentFabric.create(req.body);

res.status(201).json({
success:true,
data:fabric
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getFabrics = async(req,res)=>{
try{

const fabrics =
await GarmentFabric.find();

res.json({
success:true,
data:fabrics
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getFabricById = async(req,res)=>{
try{

const fabric =
await GarmentFabric.findById(req.params.id);

res.json({
success:true,
data:fabric
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.updateFabric = async(req,res)=>{
try{

const fabric =
await GarmentFabric.findByIdAndUpdate(
req.params.id,
req.body,
{
new:true
}
);

res.json({
success:true,
data:fabric
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.deleteFabric = async(req,res)=>{
try{

await GarmentFabric.findByIdAndDelete(
req.params.id
);

res.json({
success:true,
message:"Fabric deleted"
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};