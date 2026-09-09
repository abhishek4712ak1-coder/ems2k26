import mongoose from "mongoose";
import Count from "./count.model.js";


const teamSchema = new mongoose.Schema({

    tid: {
        type: String,
        required: true,
        unique: true
    },

    name: {

        type: String,
        required: false
    },


    event: {
        type: String,
        required: true
    },

    temp_members: {
        type: [String],
        required: true
    },
    
    actual_members: {
        type: [String],
        
    },
    
    created_by: {
        type: String,
        required: true
    }

});




teamSchema.pre("save", async function (next) {
    try {
        const prevCount = await Count.findOne({ name: "teamCount" });

        if (prevCount) {
            // Increment count if the document exists
            const val = prevCount.count + 1;

            try {
                const result = await Count.updateOne(
                    { name: "teamCount" }, // Match criteria
                    { $set: { count: val } } // Update values
                );

                if (result && result.modifiedCount === 1) {
                    console.log('Last Count Team updated successfully');
                } else {
                    console.log('Last Count Team not found or not updated');
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            // Create a new document if 'lastCount' document doesn't exist
            const cc = new Count({
                name: "teamCount",
                count: 1
            });

            await cc.save();
        }

        next(); // Call next after processing
    } catch (error) {
        console.log(error);
        next(error);
    }
});


export default mongoose.model('teamEvents', teamSchema, 'teamEvents');