const express=require('express');
const post = require('../models/post');
const router=express.Router();
const adminLayout='../views/layouts/admin'
const User=require('../models/user');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const user = require('../models/user');
const jwtSecretKey=process.env.JWT_SECRET_KEY;

const authMiddleware=async(req,res,next)=>{
    const token=req.cookies.token;
    if(!token)
    {
        res.status(401).json({message:'Unauthorized'});
    }
    try {
        const decoded=jwt.verify(token,jwtSecretKey);
        req.userId=decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({message:'Unauthorized'})
    }
}

// GET - Signin Page 
router.get('/admin',async(req,res)=>{
    try{
        const locals={
            title:'Admin',
            description:'Simple Blog created with nodejs , Express&mongo ',
        }
        res.render('admin/index',{locals,layout:adminLayout,notMatch:false})
    }
    catch(error){
        console.log(error);
    }
})
//POST - Login
router.post('/admin',async(req,res)=>{
   try {
      const {username,password}=req.body;
      const myUser=await User.findOne({ username });  
      if(!myUser){
        res.status(400).render('admin/index',{
            currentRoute:'',
            notMatch:true
        });
        return;
      }
      const isPassword=await bcrypt.compare(password,myUser.password);
      if(!isPassword){
        // return res.status(400).json({Message:'Invalid Credentials'});
        res.status(400).render('admin/index',{
            currentRoute:'',
            notMatch:true
        });
        return;
      }
      const token=jwt.sign({userId:user._id},jwtSecretKey);
      res.cookie('token',token,{httpOnly:true});
      res.redirect('dashboard')
   } catch (error) {
    console.log(error);
   }
  
});
//POST - Register
router.post('/register',async(req,res)=>{
    try {
        const {username,password}=req.body;
        const isExist=await User.findOne({username});
        if(isExist)
        {
            return res.status(400).json({Message:'This User already exists try another one'});
        }
        const hashedPassword=await bcrypt.hash(password,10);
        try {
            const user=await User.create({username:username,password:hashedPassword});
            res.status(201).json({message:'User Created',user});
        } catch (error) {
            if(error.code===11000)
            {
                res.status(401).json({message:'User already in use'});
            }
            res.status(500).json({message:'Internal server error'});
        }

    } catch (error) {
        console.log(error);
    }
})
//GET - Admin-Dashboard
router.get('/dashboard',authMiddleware,async(req,res)=>{
    try {
        const locals={
            title:"Dashboard",
            description:"Admin dashboard which control the flow of the application from"
        }
    const data=await post.find();
    res.render('admin/dashboard',{locals,data,layout:adminLayout});
    } catch (error) {
        console.log(error.message);
    }
    
})
//GET - Admin-AddPost
router.get('/add-post',(req,res)=>{
    const locals={
        title:"Add New Post",
        description:"for admin to add new post"
    }
    res.render('admin/admin-add-post',{locals,layout:adminLayout});
})
//POST - Admin-Add Post 
router.post('/add-post',async(req,res)=>{
    try {
        console.log(req.body);
        const newPost=new post({
            title:req.body.title,
            body:req.body.body
        })
        await newPost.save();
        res.redirect('/dashboard');
   } catch (error) {
        console.log(error);
   }
})

//Get - Admin-Edit Post

router.get('/edit-post/:id',async(req,res)=>{
  
    try {
        const locals={
            title:"Edit Post",
            description:"Admin dashboard which control the flow of the application from"
        }
        const data=await post.findById(req.params.id);
        res.render('admin/edit-post',{locals,data,layout:adminLayout});
        
    } catch (error) {
        console.log(error);  
    }
    
})

// PUT -> Admin - Edit-post    

router.put('/edit-post/:id',async(req,res)=>{

    try {
        await post.findByIdAndUpdate(req.params.id,{
            title:req.body.title,
            body:req.body.body,
            updatedAt:Date.now()
        })
        res.redirect(`/edit-post/${req.params.id}`)
    } catch (error) {
        console.log(error);
    }
})

//Delete -> Admin - Delete-Post
router.delete('/delete-post/:id',async(req,res)=>{
    try {
        await post.deleteOne({_id:req.params.id});
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error)
    }
}) 

//GET -> Admin - LogOut
router.get('/logout',(req,res)=>{
    res.clearCookie('token');
    res.redirect('/')
})
module.exports=router;