//rotas de admin

const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require("../models/Categoria")
require("../models/Postagem")
const {eAdmin} = require("../helpers/eAdmin")  //de denctro de admin, pegaremos apenas a função eAdmin
const Categoria = mongoose.model("categorias")
const Postagem = mongoose.model("postagens")

router.get('/', eAdmin,(req,res) => {
    res.render("admin/index")
})

router.get('/posts',(req,res) => {
    res.send("Página de posts")
})

router.get('/categorias',eAdmin,(req,res) => {
    Categoria.find().sort({date: 'desc'}).then((categorias)=>{
        res.render('admin/categorias', {categorias: categorias.map((categorias) => categorias.toJSON())})    
    }).catch((err) => {
        req.flash("error_msg","Houve um erro ao listar as categorias")
        res.redirect("/admin")
    })
})

router.get('/categorias/add',eAdmin,(req,res) => {
    res.render('admin/addcategorias')
})

router.post('/categorias/nova',eAdmin,(req,res) => {
    //Validações na requisição
    var erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null ){
        erros.push({texto:"Nome inválido!"})
    }

    if(!req.body.slug || req.body.slug == undefined || req.body.slug == null){
        erros.push({texto:"Slug inválido!"})
    }
    if(req.body.nome.length < 2){
        erros.push({texto: "Nome da categoria é muito pequeno!"})
    }

    if(erros.length > 0){
        res.render("admin/addCategorias",{erros: erros})
    }else{
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug
        }
    
        new Categoria(novaCategoria)
        .save()
        .then(()=>{ 
            req.flash("success_msg","Categoria criada com sucesso!")
            res.redirect("/admin/categorias")
        })
        .catch((err)=>{
            req.flash("error_msg","Houve um erro ao salvar a categoria, tente novamente!")
            res.redirect("/admin")
        })
    }
})

router.get("/categorias/edit/:id",eAdmin,(req,res) => {
    Categoria.findOne({_id:req.params.id})
    .then((categoria)=>{
        res.render('admin/editcategorias',{categoria: categoria.toJSON()})
    })
    .catch((err)=>{
        req.flash("error_msg","Esta categoria não existe")
        res.redirect('/admin/categorias')
    })
})

router.post("/categorias/edit",eAdmin,(req,res)=>{
    Categoria.findOne({_id: req.body.id}).then((categoria)=>{

        categoria.nome = req.body.nome
        categoria.slug = req.body.slug

        //notar que o save está associado a categoria retornada e não à const Categoria
        //criar função para validação dos campos
        categoria.save().then(()=>{
            req.flash("success_msg","Categoria atualizada com sucesso")
            res.redirect("/admin/categorias")
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro ao editar a cateogria.")
            res.redirect("/admin/categorias")
        })
    })
})

router.post("/categorias/deletar",eAdmin,(req,res) => {
    Categoria.deleteOne({_id: req.body.id}).then(()=>{
        req.flash("success_msg","Categoria deletada com sucesso.")
        res.redirect('/admin/categorias')
    }).catch(()=>{
        req.flash("error_msg","Erro ao deletar categoria")
        res.redirect('/admin/categorias')
    })
})

router.get("/postagens",eAdmin,(req,res)=>{
Postagem.find().lean().sort({data: "desc"}).populate("categoria").then((postagens)=>{
        res.render("admin/postagens", {postagens: postagens})
    }).catch((err)=>{
        req.flash("error_msg","Houve um erro a listar postagens")
        res.redirect("/admin")
    })
})

router.get("/postagens/add",eAdmin,(req,res)=>{
    Categoria.find().then((categorias)=>{
        res.render("admin/addpostagem",{categorias: categorias.map((categorias) => categorias.toJSON())}) 
    }).catch((err)=>{
        res.flash("error_msg", "Houve um erro ao carregar categorias!")
        res.redirect("/admin")
    })
})

router.post("/postagens/nova",eAdmin,(req,res)=>{

    var erros = [];

    if(req.body.categoria == "0"){
        erros.push({texto: "Categoria Inválida, registre uma categoria."})
    }
    
    if(erros.length > 0){
        res.render("admin/postagem",{erros:erros})
    }else{
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug
        }
        new Postagem(novaPostagem).save().then(()=>{
            req.flash("success_msg","Postagem criada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro durante o salvamento da postagem")
            res.redirect("/admin/postagens")
        })
    }
})

router.post("/postagens/edit",eAdmin,(req,res)=>{
    
    Postagem.findOne({_id:req.body.id}).then((postagem)=>{
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(()=>{
            req.flash("success_msg","Postagem Alterada!")
            res.redirect("/admin/postagens")
        }).catch((err)=>{
            req.flash("error_msg","Erro interno")
            req.redirect("/admin/postagens")
        })
    }).catch((err)=>{
        req.flash("error_msg","Erro ao editar post!")
        res.redirect("/admin/postagens")
    })

})

router.get("/postagens/edit/:id",eAdmin,(req,res) =>{
    Postagem.findOne({_id:req.params.id}).then((postagem)=>{

        Categoria.find().then((categorias)=>{
            res.render("admin/editpostagens",{postagem:postagem.toJSON(), categorias: categorias.map((categorias) => categorias.toJSON())})
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro ao listar Categorias!")
            res.redirect("/admin/postagens")
        })
        
    })
    .catch((err)=>{
        req.flash("error_msg","Houve um erro ao carregar formulário de edição.")
        res.redirect("/admin/postagens")
    })
    // res.render("admin/editpostagens")
})

router.post("/postagens/deletar",eAdmin,(req,res)=>{
    
    Postagem.deleteOne({_id: req.body.id}).then(()=>{
        req.flash("success_msg","Postagem deletada!")
        res.redirect("/admin/postagens")
    }).catch(()=>{
        req.flash("error_msg","Houve um erro ao deletar a postagem!")
        res.redirect("/admin/postagens")
    })
})

module.exports = router