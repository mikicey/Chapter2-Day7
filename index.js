const{checkLogin,alreadyLogin} = require("./middleware/authentication");




const express = require("express");
const app = express();
const PORT = process.env.PORT || 80

const upload = require("./middleware/multer")


const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash")
const db = require("./connection/db");

const {getDuration} = require("./helpers/index");
const {getDateStringFormat} = require("./helpers/index")


app.use(flash());
// Url encoded middleware
app.use(express.urlencoded({extended:false}));

// Static middleware
app.use(express.static("static"));
app.use(express.static("uploads"));

// Engine
app.set("view engine", "hbs");

// Express session
app.use(session({
    secret: "k320irh028ih2",
    resave:false,
    saveUninitialized:true,
    cookie: {
        maxAge: 2 * 60 * 60 * 1000 // 2 JAM
    }
}))

// Connect
db.connect(function(err,client,done){



// REGISTER
app.get("/register", alreadyLogin, (req,res)=>{
    res.render("register",{isLogin:req.session.isLogin})
})

app.post("/register", alreadyLogin, (req,res)=>{
    const {email,password,username} = req.body;
    const hashedPassword = bcrypt.hashSync(password,10);

    client.query(`SELECT * FROM public.users WHERE email=$1`,[email], (err,result)=>{
        // Check email
        if(result.rows.length != 0){
            return res.render("register",  {emailError:"Email is already registered",email,password,username} )
        } 
    
        // Insert Password
        client.query(`INSERT INTO public.users("username", "email", "password")
    VALUES ($1, $2, $3)`, [username, email, hashedPassword] , (err,result)=>{
        if(err) throw err;
        res.redirect("/login");; })
    })

    
    
})

// LOGIN 
app.get("/login", alreadyLogin,(req,res)=>{
    res.render("login",{isLogin:req.session.isLogin});
})

app.post("/login", alreadyLogin,(req,res)=>{
     const {email,password} = req.body;

     client.query(`SELECT * FROM public.users WHERE email=$1`,[email], (err,result)=>{
        let user = result.rows[0];
 
        // Check email sudah terdaftar atau tidak
        if(result.rows.length == 0){
            return res.render("login",  {emailError:"Email not yet registered",email,password})
        }

        const isMatch = bcrypt.compareSync(password,user.password);

        // Check apakah password udah benar
        if(!isMatch) {
              return res.render("login", {pwError:"Wrong password",email,password})
        } else {
            req.session.isLogin = true;
            req.session.user = {
                id : result.rows[0].user_id,
                username: result.rows[0].username,
                email:result.rows[0].email
            }
            res.redirect("/")
        }

     


        
    });
    
})

// LOGOUT 
app.get("/logout",checkLogin,(req,res)=>{
    req.session.destroy();
    res.redirect("/");
})

                        //    ROUTES
// GET ALL
app.get("/" , (req,res)=> {
    if(err) throw err;
    
    client.query(`SELECT public.projects.*, public.users.user_id , public.users.username
                  FROM public.projects LEFT JOIN public.users 
                  ON public.projects.projectowner_id = public.users.user_id 
                  ORDER BY public.projects.id DESC`,(err,result)=>{
        if(err) throw err;
        let data = result.rows;

        // Default
        data = data.map((item)=>{
            return {
                ...item,isLogin:req.session.isLogin
            }
        })

        // If already loginned
        if(req.session.isLogin){
            data = data.filter((item)=> item.projectowner_id == req.session.user.id)
        }

        // Check Post
        const isPostNotThere = data.length == 0 ? true : false;

        res.render("home",{data:data,isPostNotThere,isLogin:req.session.isLogin})
        
    })

})


// GET SINGLE
app.get("/single/:id",(req,res)=>{
    if(err) throw err;

    const id = req.params.id;
    

    client.query(`SELECT public.projects.*, public.users.user_id , public.users.username
    FROM public.projects LEFT JOIN public.users 
    ON public.projects.projectowner_id = public.users.user_id 
    WHERE id=${id}`, (err,result)=>{
        let data = result.rows[0];
        res.render("single",{data:data,isLogin:req.session.isLogin})
        
    });

});


app.get("/addmyproject",checkLogin,(req,res)=>{
    res.render("addproject",{isLogin:req.session.isLogin})    
});

app.get("/contact",(req,res)=>{
    res.render("contact",{isLogin:req.session.isLogin})
});

// POST
app.post("/postmyproject",checkLogin, upload.single('image'),(req,res)=>{

    if(err) throw err;
    const id = req.session.user.id;
    const newData = req.body;

    // Duration
    const duration = getDuration(req.body.startDate,req.body.endDate);
    const stringDate = getDateStringFormat(req.body.startDate) + '-' + getDateStringFormat(req.body.endDate);

    // Tech
    const technologies = {
        isNode: req.body.node ? true : false,
        isReact: req.body.react ? true:false,
        isJS : req.body.js ? true : false,
        isCSS : req.body.css ? true : false
    };

    // Image
    const image = req.file.filename;


    client.query(`INSERT INTO public.projects("title", "startDate", "endDate", "stringDate", duration, description, img,  projectowner_id,tech)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [newData.title, newData.startDate, newData.endDate, stringDate, duration, newData.description, image, id,technologies] , (err,result)=>{
            if(err) throw err;
            res.redirect("/"); })
});


// DELETE
app.get("/deletemyproject/:id",checkLogin,(req,res)=>{

    
    const id = req.params.id;
    const user_id = req.session.user.id;

    // Check authority
    client.query(`SELECT projectowner_id FROM public.projects WHERE id=${id}`,(err,result)=>{
         

          if(user_id != result.rows[0].projectowner_id){
            console.log("Not Deleted")
            return res.sendStatus(404);
          } 
            
            // Delete
            console.log("Deleted")
            client.query(`DELETE FROM public.projects
            WHERE id=${id}`, (err,result)=>{
                if(err) throw err;
                res.redirect("/");
                
            })

          
    })
    
   

})

// EDIT
     // get edit form page
app.get("/editproject/:id", checkLogin,(req,res)=>{
       if(err) throw err;
       const id = req.params.id;
       const user_id = req.session.user.id;


       // Check authority
    client.query(`SELECT projectowner_id FROM public.projects WHERE id=${id}`,(err,result)=>{
        if(user_id != result.rows[0].projectowner_id)
        { return res.sendStatus(404)} 
          
          // Show Page
            client.query(`SELECT * FROM public.projects WHERE id=${id}`, (err,result)=>{
            if(err) throw err;
    
            let data = result.rows[0];
            res.render("editproject",{dataToEdit:data,isLogin:req.session.isLogin})
        })
    })
  
       

});
    // submit form from edit page
app.post("/editmyproject/:id", checkLogin, upload.single('image'), (req,res)=>{
    if(err) throw err;

    const id = req.params.id;
    const user_id = req.session.user.id;
    const updatedData = req.body;

           // Check authority
           client.query(`SELECT projectowner_id FROM public.projects WHERE id=${id}`,(err,result)=>{
            if(user_id != result.rows[0].projectowner_id)
            { return res.sendStatus(404)} 
              
           // Set Update

                // Time related
                const duration = getDuration(req.body.startDate,req.body.endDate);
                const stringDate = getDateStringFormat(req.body.startDate) + '-' + getDateStringFormat(req.body.endDate);

                // Tech Related
                const technologies = {
                isNode: req.body.node ? true : false,
                isReact: req.body.react ? true:false,
                isJS : req.body.js ? true : false,
                isCSS : req.body.css ? true : false
                 };

                // Image Related
                const image = req.file.filename;

                     // Update Page
                client.query(`UPDATE public.projects
	            SET title=$1, "startDate"=$2, "endDate"=$3, "stringDate"=$4, duration=$5, description=$6, img=$7, tech=$8
	            WHERE id=$9`,[updatedData.title, updatedData.startDate, updatedData.endDate, stringDate, duration, updatedData.description, image, technologies,id], (err,result)=>{
                if(err) throw err;
                res.redirect("/");
                });
            
        })


})




});


app.listen(PORT, ()=>{
    console.log(`Connected to ${PORT}`)
})


