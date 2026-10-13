// ALL CONTENT IN THIS MODULE IS FICTIONAL DEMONSTRATION DATA.
export const period = "Apr 2025 – Sep 2026";
export const students = [
  {id:"ST-001",name:"Avery Chen",initials:"AC",age:"5 years",className:"Explorer Class",color:"peach",teacher:"jordan",strengths:["Storytelling","Collaboration"],level:76,
    observations:[
      ["2025-04-17","Communication","Used gestures and a few spoken words to share an idea during circle time."],
      ["2025-08-06","Social-emotional","Invited a new classmate to join a block-building activity and shared materials."],
      ["2025-12-10","Literacy","Recognised letters in her name and identified familiar words on picture cards."],
      ["2026-03-21","Numeracy","Counted ten objects and matched sets to numeral cards with minimal prompting."],
      ["2026-06-18","Communication","Retold a favourite story in sequence with beginning, middle and ending."],
      ["2026-09-02","Creative expression","Combined paper shapes and drawings to illustrate a group story."],
    ]},
  {id:"ST-002",name:"Noah Lim",initials:"NL",age:"5 years",className:"Explorer Class",color:"sky",teacher:"jordan",strengths:["Problem solving","Numbers"],level:69,
    observations:[
      ["2025-04-18","Numeracy","Sorted objects by shape and colour with prompts."],
      ["2025-08-27","Communication","Asked peers follow-up questions during a hands-on group experiment."],
      ["2025-11-17","Social-emotional","Practised taking turns while using shared classroom tools."],
      ["2026-02-11","Numeracy","Recognised number patterns and counted groups of fifteen objects."],
      ["2026-06-09","Creative expression","Designed a paper bridge and explained how to make it stronger."],
      ["2026-09-08","Literacy","Used drawing and initial sounds to describe a short invented story."],
    ]},
  {id:"ST-003",name:"Mia Tan",initials:"MT",age:"4 years",className:"Discovery Class",color:"lilac",teacher:"jordan",strengths:["Creativity","Curiosity"],level:81,
    observations:[
      ["2025-04-29","Creative expression","Explored paint textures and chose colours to express feelings."],
      ["2025-07-03","Communication","Described a family drawing to the teacher using short sentences."],
      ["2025-12-04","Social-emotional","Helped organise a shared art station without being asked."],
      ["2026-04-17","Numeracy","Recognised repeating patterns using coloured beads."],
      ["2026-07-19","Literacy","Recognised familiar signs and attempted to write her first name."],
      ["2026-09-15","Communication","Presented an artwork to peers and answered simple questions."],
    ]},
  {id:"ST-004",name:"Ethan Wong",initials:"EW",age:"5 years",className:"Discovery Class",color:"mint",teacher:"lee",strengths:["Teamwork","Language"],level:73,
    observations:[
      ["2025-04-10","Communication","Followed two-step instructions during morning routines."],
      ["2025-07-15","Social-emotional","Worked through a disagreement after teacher guidance."],
      ["2025-11-30","Literacy","Matched rhyming sounds during a group game."],
      ["2026-02-13","Numeracy","Used concrete objects to demonstrate simple addition."],
      ["2026-06-11","Creative expression","Collaborated on a classroom mural with three classmates."],
      ["2026-09-22","Communication","Spoke confidently about his favourite book during show-and-tell."],
    ]},
  {id:"ST-005",name:"Isla Rahman",initials:"IR",age:"4 years",className:"Discovery Class",color:"rose",teacher:"lee",strengths:["Empathy","Imagination"],level:66,
    observations:[
      ["2025-04-22","Social-emotional","Comforted a classmate who was upset during transition time."],
      ["2025-08-13","Numeracy","Compared groups using language such as more and fewer."],
      ["2025-12-03","Communication","Described the steps of planting a seed during class activity."],
      ["2026-03-18","Creative expression","Invented characters during pretend-play in a small group."],
      ["2026-06-27","Literacy","Pointed to words during shared reading and recognised common letter sounds."],
      ["2026-09-16","Social-emotional","Negotiated roles with peers during a make-believe shop activity."],
    ]},
];
export const domains=["Communication","Literacy","Numeracy","Social-emotional","Creative expression"];
export const teacherAssignments = {jordan:["ST-001","ST-002","ST-003"],lee:["ST-004","ST-005"],all:students.map(s=>s.id)};
export function evidenceFor(student,extra=[]){return [...student.observations.map((r,i)=>({id:`${student.id}-E${String(i+1).padStart(2,"0")}`,date:r[0],domain:r[1],text:r[2]})),...extra.filter(e=>e.studentId===student.id)].sort((a,b)=>b.date.localeCompare(a.date));}
export function mockPortfolio(student,observations){
 const itemsByDomain=d=>observations.filter(x=>x.domain===d);
 const domainText=(d)=>{const items=itemsByDomain(d);if(!items.length)return `No ${d.toLowerCase()} evidence has been recorded in this demonstration. Additional teacher observations are needed.`;return `${student.name.split(" ")[0]}'s documented progress includes ${items.map(x=>x.text.replace(/\.$/,"").replace(/^[A-Z]/,s=>s.toLowerCase())).slice(0,2).join("; ")}.`;};
 return {summary:`Over the 18-month period, ${student.name} has participated in a range of preschool learning experiences. Available teacher observations describe growth in ${[...new Set(observations.map(x=>x.domain))].slice(0,3).join(", ").toLowerCase()}. This example is assembled from fictional records and needs educator verification.`,domains:Object.fromEntries(domains.map(d=>[d,domainText(d)])),nextSteps:`Provide ${student.name.split(" ")[0]} with regular opportunities to practise collaborative play, communicate ideas and revisit learning through teacher-guided activities. Confirm priorities with the student's teacher before publishing.`,evidenceIds:observations.map(x=>x.id),generationMode:"mock"};
}
export function validatePortfolio(obj,observations){
 if(!obj||typeof obj!=="object")throw new Error("AI response was not a portfolio object.");
 const fallback = {summary:"",domains:{},nextSteps:"",evidenceIds:[]};
 const merged={...fallback,...obj};
 if(typeof merged.summary!=="string"||typeof merged.nextSteps!=="string")throw new Error("Portfolio is missing textual sections.");
 const allowed=new Set(observations.map(x=>x.id));
 merged.evidenceIds=Array.isArray(obj.evidenceIds)?obj.evidenceIds.filter(x=>allowed.has(x)):[];
 merged.domains=Object.fromEntries(domains.map(d=>[d,typeof obj.domains?.[d]==="string"?obj.domains[d]:"Not covered in the current generated evidence."]));
 return merged;
}
