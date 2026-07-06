class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong") {
        super(message);

        this.statusCode = statusCode;
        this.success = false;
    }
}


export {ApiError}




// I create custom error classes because the built-in Error only tells me what went wrong, while my custom class also tells my application how to handle it (404, 401, 500, etc.).