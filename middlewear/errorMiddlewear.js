const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error/500');

}

module.exports ={
    errorHandler
}