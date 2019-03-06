'use strict'

const fs = require('fs');
const path = require('path');

function getImage(res ,dir, image){
    let path_file = dir + image;
    fs.exists(path_file, exists =>{ 
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else
            res.status(404).send({message:'Imagem não existe!'})
    })
}

module.exports = getImage;
