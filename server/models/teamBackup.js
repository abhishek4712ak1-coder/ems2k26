import mongoose from "mongoose";



const teamSchema = new mongoose.Schema({

    tid: {
        type: String,
        
        
    },

    name: {

        type: String,
        
    },


    event: {
        type: String,
        
    },

    temp_members: {
        type: [String],
       
    },
    
    actual_members: {
        type: [String],
        
    },
    
    created_by: {
        type: String,
        
    }

});





export default mongoose.model('teamBackup', teamSchema, 'teamBackup');