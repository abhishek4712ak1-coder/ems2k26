import Events from "../models/event.model.js";
import individualEvents from "../models/individual.model.js";
import teamEvents from "../models/team.model.js";
import Students from "../models/student.model.js";
import Count from "../models/count.model.js";
import teamBackup from "../models/teamBackup.js";
import invitation from "../models/invitation.model.js";

const TEAM = teamEvents;
const INVITATION = invitation;
const TEAM_BACKUP = teamBackup;
const INDIVIDUAL = individualEvents;
const STUDENT = Students;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


export const getIndividualEvents = async(req,res) => {
  try {

    const IndiEvents = await Events.find({type:"Individual"})
    res.status(200).json(IndiEvents)

  } catch (error) {
    console.log(`error in getIndividualEvents ${error}`);
    res.status(500).json({message:"server error"})
  }
}


export const getTeamEvents = async(req,res) => {
  try {

    const IndiEvents = await Events.find({type:"Team"})
    res.status(200).json(IndiEvents)

  } catch (error) {
    console.log(`error in getIndividualEvents ${error}`);
    res.status(500).json({message:"server error"})
  }
}

//helpers

async function fetchDetailsPid(pid) {
    try {
        const data = await Students.findOne({ pid: pid })
        if (!data) {
            return null;
        }

        return data;
    }

    catch (error) {
        console.log(error)
        return null
    }
}

//for total
async function maxEventsCanParticipated(email,iEvents){
  try {

    const student = await Students.findOne({email:email});
    const pid = student.pid

    const indiEvents = iEvents.length;
    const tEvents = await teamEvents.countDocuments({actual_members:pid});

    const totalEvents = indiEvents + tEvents;

    if(student.college === "SRMSCET"){
      if(totalEvents <= 6){
        return true
      }
      else{
        return false
      }
    }
    else{
      if(totalEvents <= 8){
        return true
      }
      else{
        return false
      }
    }

  } catch (error) {
    console.log(`error in maxEventsCanParticipated ${error}`)
  }
}

async function maxEventParticipationTeam(pid1) {
    try {
        const student = await Students.findOne({ pid: pid1 })
        if (!student) {
            return false;
        }

        const individualParticipation = await individualEvents.findOne(
            { email: student.email },
            { events: 1 }
        );
        const individualCount = individualParticipation?.events?.length || 0;
        const teamCount = await teamEvents.countDocuments({ actual_members: pid1 });
        const participationLimit = student.college === "SRMSCET" ? 6 : 8;

        return individualCount + teamCount < participationLimit;
    }
    catch (error) {
        console.log(`error in maxEventParticipationTeam ${error}`)
        return false;
    }
}

async function getLastCount() {

    try {

        const count1 = await Count.findOne({ name: "teamCount" })

        if (count1) {
            const lastVal = count1.count;
            return lastVal
        }

        else {
            return false;
        }


    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function sendInvitation(email, pid, tid1, team_name, event1) {
    try {

        const invi = new invitation({
            email: email,
            pid: pid,
            tid: tid1,
            team_name: team_name,
            event: event1
        })
        const result = await invi.save()

        return result;
    }

    catch (error) {
        console.log(error)

    }
}



export const checkPID = async (req, res) => {
    try {

        const pid1 = req.body.pid;
        const data = await Students.findOne({ pid: pid1 });
        if (!data) {
            return res.status(404).json({ message: 'PID not found!' });
        }
        console.log(data)

        const maxCondition = await maxEventParticipationTeam(pid1);

        if (!maxCondition) {
            return res.status(400).json({ message: 'Maximum participation condition exceeded!' });
        }
        res.status(200).json({ message: 'Student found', data: data });

    }
    catch (error) {
        console.log(error);
    }
}


export const saveIndividualEvents = async (req, res) => {
    try {
        
        
        const email = req.email


        //get the data from the request body 
        const data = req.body.data

        console.log("events: ", data)

        //user participation verify logic 
        const userParticipation = await maxEventsCanParticipated(email, data);

        if (!userParticipation) {
            return res.status(401).json({ message: 'You have exceeded the maximum number of events' })
        }

        const existingEvent = await individualEvents.findOne({ email: email });

        if (existingEvent) {
            // Update the existing record with the new data
            existingEvent.events = data; // You can merge or replace as needed
            await existingEvent.save();
            res.status(200).json({ message: 'Updated successfully' });

        } else {
            // Optionally, create a new record if it doesn't exist
            const individualEvent = new individualEvents({
                email: email,
                events: data
            });
            await individualEvent.save();
            res.status(200).json({ message: 'Saved successfully' });
        }

        console.log(data)

    }

    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error!" })
    }
}


export const saveTeam = async (req, res) => {
    try {
        const email = req.email;
        const { name, event, members } = req.body;
        const teamNameValue = typeof name === "string" ? name.trim() : "";
        const eventValue = typeof event === "string" ? event.trim() : "";

        if (!teamNameValue || !eventValue || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ message: 'Team name, event, and at least one member are required' });
        }

        const creator = await Students.findOne({ email }).select("pid").lean();
        if (!creator) {
            return res.status(400).json({ message: 'Create your student profile before creating a team' });
        }

        const uniqueMembers = [...new Set(
            members.map((member) => String(member || '').trim().toUpperCase()).filter(Boolean)
        )];
        if (!uniqueMembers.includes(creator.pid)) {
            uniqueMembers.unshift(creator.pid);
        }

        const teamName = await teamEvents.findOne({ name: teamNameValue })
        if (teamName) {
            return res.status(400).json({ message: 'Team name already exists' });
        }

        const event2 = await Events.findOne({
            type: "Team",
            event: {
                $regex: `^${escapeRegex(eventValue)}$`,
                $options: "i",
            },
        });
        if (!event2) {
            return res.status(404).json({ message: 'Selected team event was not found' });
        }

        const eventName = event2.event;
        const maxC = Number(event2.limit);
        if (!Number.isFinite(maxC) || maxC < 1) {
            return res.status(400).json({ message: 'This event does not have a valid team limit' });
        }

        if (uniqueMembers.length > maxC) {
            return res.status(400).json({ message: 'Maximum team participation reached' });
        }

        const foundPids = []; // Array to store found pids

        const promises = uniqueMembers.map(async (member) => {
            const result = await teamEvents.findOne({
                event: eventName,
                actual_members: { $in: [member] }  
            });

            
            if (result) {
                foundPids.push(member); 
            }
        });

 
        await Promise.all(promises);
        const pidsString = foundPids.join(', ');
        if (foundPids.length > 0) {
            return res.status(400).json({ message: `Pids ${pidsString} are already registered for ${eventName}` });

        }

        const memberDetails = await Promise.all(
            uniqueMembers.map(async (member) => {
                const data = await fetchDetailsPid(member);
                return data ? { pid: data.pid, email: data.email } : null;
            })
        );

        const missingPid = uniqueMembers[memberDetails.findIndex((member) => !member)];
        if (missingPid) {
            return res.status(404).json({ message: `Participant ID ${missingPid} was not found` });
        }

        const lastCount = await getLastCount();
        console.log("Last Team Count", lastCount)

        const tid = "T" + Number(lastCount + 1)

        //save the data in the  team database 
        const team = new teamEvents({
            tid: tid,
            name: teamNameValue,
            event: eventName,
            temp_members: uniqueMembers,
            actual_members: [creator.pid],
            created_by: email
        })


        await team.save();

        const tid1 = team.tid;
        const team_name = team.name;
        const event1 = team.event;

        for (var i = 0; i < memberDetails.length; i++) {
            const email = memberDetails[i].email;
            const pid = memberDetails[i].pid;

            if (pid !== creator.pid) {
                await sendInvitation(email, pid, tid1, team_name, event1);
            }
        }

        res.status(201).json({ message: "Team Saved Successfully!" })

    }
    catch (error) {
        console.log(`error in saveTeam ${error}`);
        res.status(500).json({ message: "Server Error!" });
    }
}


export const getInvitation = async (req, res) => {
    try {


        const emailToken = req.email;

        console.log(emailToken)
        const data = await invitation.find({ email: emailToken });

        if (!data) {
            return res.status(404).json({ message: "No Invitation Found!" });
        }

        res.status(200).json(data);

    }
    catch (error) {
        console.log(`error in getInvitation ${error}`);

    }
}


export const addVerifiedMember = async (req, res) => {
    try {
        //verifivcattion logic above

        const tid = String(req.body.tid || '').trim();
        const pid = String(req.body.pid || '').trim().toUpperCase();

        //find tid 
        const team = await teamEvents.findOne({ tid: tid })
        if (!team) {
            return res.status(404).json({ message: "Team Not Found!" });
        }

        const invite = await INVITATION.findOne({ tid, pid, email: req.email });
        if (!invite) {
            return res.status(403).json({ message: "This invitation does not belong to the signed-in student." });
        }


        //chk whether pid already exist in the actual members

        if (!Array.isArray(team.actual_members)) {
            team.actual_members = [];
        }

        if (!team.actual_members.includes(pid)) {
            team.actual_members.push(pid);
        }

        // Save the updated team object
        await team.save();



        //delete the record from the invitation table
        const result = await INVITATION.deleteOne({ tid: tid, pid: pid });
        if (result.deletedCount === 0) {
            // If no documents were deleted, return a message
            return res.status(404).json({ message: 'No member found with the provided TID and PID.' });
        }

        res.status(200).json({ message: "Member Added Successfully!" });



    }
    catch (error) {
        console.log(error);
        //server erro 
        res.status(500).json({ message: "Server Error!" })
    }
}



//delete invitation member from the Invitation

export const delInvitation = async (req, res) => {
    try {
        //verification logic

        const pid = req.body.pid;
        const tid = req.body.tid;

        //chk tid exists
        // Delete the member with the specified tid and pid
        const result = await INVITATION.deleteOne({ tid: tid, pid: pid });
        console.log(result)
        if (result.deletedCount === 0) {
            // If no documents were deleted, return a message
            return res.status(404).json({ message: 'No member found with the provided TID and PID.' });
        }

        // Return success message
        return res.status(200).json({ message: 'Invitation Rejected' });


    }

    catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}


//function to delete the team by the team leader 
export const delTeam = async (req, res) => {
    try {

        //verify email with token email
      
        const tid = req.body.tid;

        

        const emailToken = req.email;

        //get the email from team leader from the tid
        const teamLeaderEmail = await TEAM.findOne({ tid: tid })

        if (!teamLeaderEmail) {
            return res.status(404).json({ message: "No team found with the provided TID" });
        }
        const email1 = teamLeaderEmail.created_by;


        console.log("edede", email1);
        //if the record is deleted by the team leader then only delete

        if (email1 !== emailToken) {
            return res.status(404).json({ message: "Team can be deleted by Team Leader only" });
        }


        //before deleting the table save deleted record in the backup table
        const backup = new TEAM_BACKUP({
            tid: teamLeaderEmail.tid,
            name: teamLeaderEmail.name,
            event: teamLeaderEmail.event,
            temp_members: teamLeaderEmail.temp_members,
            actual_members: teamLeaderEmail.actual_members,
            created_by: teamLeaderEmail.created_by,

        });

        //save in the backup table 

        await backup.save();

        //else delete the team
        const result = await TEAM.deleteOne({ tid: tid });

        console.log(result)
        //if the team is deleted then send the response
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No team found with the provided TID" });

        }

        return res.status(200).json({ message: "Team Deleted Successfully" });

    }


    catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}



//get the indiviaul and team events participated by student

export const individualParticipation = async (req, res) => {
    try {


     

        const emailToken = req.email;

        const response = await INDIVIDUAL.findOne({ email: emailToken });

        if (!response) {
            return res.status(404).json({ message: 'No individual found with the provided email.' });
        }

        //get the pid from the STUDENT table using email
        const pid = await STUDENT.findOne({ email: emailToken }).select('pid')

        //retrn the response
        res.status(200).json({ data: response, pid: pid })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })

    }
}


export const teamParticipation = async (req, res) => {
    try {

        const emailToken = req.email;
        //find pid from the email from student collectiond 

        const pidData = await STUDENT.findOne({ email: emailToken }, { pid: 1 });
        if (!pidData) {
            return res.status(404).json({ message: 'No student found with the provided email.' })
        }


        //get the pid
        const pid = pidData.pid


        const response = await TEAM.find({ actual_members: { $in: [pid] } });

        if (!response) {
            return res.status(404).json({ message: 'No individual found with the provided email.' });
        }
        console.log(response)

        //retrn the response
        res.status(200).json({ data: response })

    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })

    }
}