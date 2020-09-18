//carregando módulos
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const admin = require('./routes/admin')
const usuarios = require('./routes/usuario')
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash')
require("./models/Postagem")
require("./models/Categoria")
const Categoria = mongoose.model("categorias")
const Postagem = mongoose.model("postagens")
const passport = require("passport")
require("./config/auth")(passport)
const db =require("./config/db")

//Inicializando express
    const app = express()

//Config's
    //Sessão
        //session
        app.use(session({
            secret: "cursodenode",
            resave: true,
            saveUninitialized: true
        }))

        //é extramemente importante manter essa sequencia. (initialize e session após  session e antes do flash)
        app.use(passport.initialize())
        app.use(passport.session())
        //flash
        app.use(flash())
    //Middleware
        app.use((req,res,next) => {
            //variaveis globais
            res.locals.success_msg = req.flash("success_msg")
            res.locals.error_msg = req.flash("error_msg")
            //variavel global de erro do passport
            res.locals.error = req.flash("error")
            res.locals.user = req.user || null
            next()
        })
    //Body Parser
        app.use(bodyParser.urlencoded({extended:true}))
        app.use(bodyParser.json())
    
    //Handlebars
        app.engine('handlebars',handlebars({defaultLayout: 'main'}))
        app.set('view engine','handlebars')
    //Mongoose
        mongoose.Promise = global.Promise;
        mongoose.connect(db.mongoURI)
            .then(()=>console.log("Conectado ao mongo"))
            .catch((err)=>console.log("Erro ao se conectar: " + err))
    //Public
        //é utilizado o path.join e o __dirname, para conseguirmos utilizar o caminho absoluto, evitando assim errors.
        app.use(express.static(path.join(__dirname,"public")))

//Rotas
    //quando é criado um arquivo para um grupo de rotas, esse grupo recebe um 'alias' que deverá ser usado como parte da url
    //no exemplo abaixo para acessar teriamos: localhost/admin como página principal e localhost/admin/posts como outra rota qlq.
    app.use('/admin',admin)
    app.use("/usuarios",usuarios)

    app.get("/",(req,res)=>{
        Postagem.find().lean().populate("categoria").sort({data: "desc"}).then((postagens)=>{
            res.render("index",{postagens: postagens})
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro interno")
            res.redirect("/404")
        })
    })

    app.get("/postagem/:slug",(req,res)=>{
        Postagem.findOne({slug: req.params.slug}).lean().then((postagem)=>{
            if(postagem){
                res.render("postagem/index",{postagem: postagem})
            }else{
                req.flash("error_msg","Essa postagem não existe")
                res.redirect("/")
            }
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro interno")
            res.redirect("/")
        })
    })

    app.get("/404",(req,res)=>{
        res.send("Error 404!")
    })

    app.get("/posts",(req,res)=>{
        res.send("Lista de Posts")
    })

    app.get("/categorias",(req,res)=>{
        Categoria.find().lean().then((categorias)=>{
            res.render("categoria/index",{categorias: categorias})
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro interno ao listar as categorias")
            res.redirect("/")
        })
    })

    app.get("/categorias/:slug",(req,res)=>{
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria)=>{
            if(categoria){
                Postagem.find({categoria: categoria._id}).lean().populate("categoria").then((postagens)=>{
                    res.render("categoria/postagens",{postagens:postagens, categoria:categoria})
                }).catch((err)=>{
                    req.flash("error_msg","Houve um erro ao listar os posts")
                    res.redirect("/")
                })
            }else{
                req.flash("error_msg","Essa categoria não existe")
                res.redirect("/")
            }
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro interno ao carregar a página desta categoria!")
            res.redirect("/")
        })
    })

    app.get("/logout",(req,res)=>{
        req.logout()
        res.redirect("/")
    })

//Outros
    const PORT = process.env.PORT || 8081
        app.listen(PORT, ()=>{
        console.log("Servidor iniciado!")
    })
