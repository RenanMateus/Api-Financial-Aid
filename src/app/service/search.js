const paginate = require('mongoose-pagination');

function search(Schema, res, busca, page, limit){ 
    if(busca){
        Schema.find( { $text: { $search: busca } } ).paginate(page, limit,  (error, result , total) =>{
            if(error)
                res.send(error);
            else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
        });
    }else{
        Schema.find().paginate(page, limit, (error, result , total) =>{
            if(error)
                res.send(error);
            else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
        });
    }

}


module.exports = {
    search
}