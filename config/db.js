//se estiver rodando local, usa db local, se estiver rodando a partir da heroku, usa db "producao"
if(process.env.NODE_ENV == "production"){
    module.exports = {mongoURI: "linkbancoonline"}
}else{
    module.exports = {mongoURI: "mongodb://localhost/blogapp"}
}