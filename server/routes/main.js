const express=require('express');
const post = require('../models/post');
const router=express.Router();

//routes 
router.get('',async(req,res)=>{
    const locals={
        title:'NodeJs Blog',
        description:'Simple Blog created with nodejs , Express&mongo ',
    }
    try{
        const perPage=4;
        const page=req.query.page||1;
        const data=await post.aggregate([{$sort: {createdAt:-1}}])
        .skip(perPage*page- perPage)
        .limit(perPage)
        .exec()

        const count=await post.countDocuments();
        const nextPage=parseInt(page+1);
        const hasNextPage=nextPage <= Math.ceil( count/perPage );
        
        res.render('index',{
            locals,
            data,
            current:page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute:'/',
        })
    }catch(error){
        console.log(error);
    }
})
router.get('/about',(req,res)=>{
    res.render('about',{
        currentRoute:'/about',
    });
})
router.get('/contact',(req,res)=>{
    res.render('contact',{
        currentRoute:'/contact',
    });
})

router.get('/post/:id',async(req,res)=>{
    const data=await post.findById({_id:req.params.id});
    const locals={
        title:data.title,
        description:'Simple Blog created with nodejs , Express&mongo ',
    }
    res.render('post',{locals,data,currentRoute:`/post/${req.params.id}`});
})

router.post('/search',async(req,res)=>{
    try{
        const locals={
            title:'Search',
            description:'Simple Blog created with nodejs , Express&mongo ',
        }
        let searchTerm=req.body.searchTerm;
        let searchNoSpecialChars=searchTerm.replace(/[^a-zA-Z0-9 ]/g,"");
        const data=await post.find({
            $or:[
                {title: {$regex:new RegExp(searchNoSpecialChars,'i')}},
                {body: {$regex: new RegExp(searchNoSpecialChars,'i')}}
            ]
        });
        res.render('search',{
            data,
            locals,
            currentRoute:'',
        });
    }
    catch(error){
        console.log(error);
    }
})

module.exports=router;