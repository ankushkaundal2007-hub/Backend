// const asyncHandler=(requestHandler) => {
//     (next,req,res)=>{
//         Promise.resolve(requestHandler()).catch((err)=>next(err));
//     }
  
// }

//next is a middleware
//if promise rejects and error is catched then error is passed to next (a middleware to handle error)


const asyncHandler = (fun) => {
    return async (req, res, next) => {
        try {
            await fun(req, res, next);
        } catch (error) {
            res.status(error.code || 500).json({
                success: false,
                message: error.message
            });
        }
    };
};

export default asyncHandler;
// "asyncHandler doesn't execute my controller immediately—it wraps it in a protected function. Express later executes that wrapper on every request, and the wrapper executes my controller inside try...catch

// "Higher-Order Function (HOF): Takes a function, returns a function. The returned function remembers the original function (closure) and adds extra behavior without changing the original."

// asyncHandler removes duplicate try...catch code by wrapping every controller with one common error handler. Each controller only focuses on its business logic