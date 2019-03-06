const express = require('express');
const router = express.Router();
const request = require('request')

function ProceduresRouter(){
    

    router.get('/consultcep/:cep', async (req, res)=>{
        try{
            let aux = req.params.cep.split(".");
            aux = aux.length > 1 ? aux[0]+aux[1]: aux[0];
            aux = aux.split('-');
            aux = aux.length > 1 ? aux[0]+aux[1]: aux[0];
            const url = 'https://viacep.com.br/ws/'+ aux +'/json/'
            await request(url, function(error, response, body){
                if(error)
                    return res.status(500).send(error);
                if(response.statusCode == 200)
                    return res.status(200).send(body);
                else
                    return res.sendStatus(400);
            })
            
        }catch(error){
            console.log(error);
            return res.sendStatus(400);            
        }
    })    
        
    
    return router;
}

module.exports = ProceduresRouter;