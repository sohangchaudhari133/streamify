
//Adding a wrapper fun for safety
  const asyncHandler = (requestHandler) =>  {
    //you have to return the function
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).
        catch((error) => next(error))
    }
  }
  
  export { asyncHandler}


//Another way to do this =>
//   const AsyncHandler = (fun) => async (req,res,next) => {
//     try {
//       await fun(req,res,next)
//     } catch (error) {

//     res.status(error.code || 500).json({
//         success:false,
//         message: error.message
//         })        
//     }
//   }
  