import mongoose from "mongoose";

const countSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true 
    },
    count:{
        type: Number,
        required: true
    }
})


export default mongoose.model("Count", countSchema);
