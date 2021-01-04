process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testBook;

beforeAll(async () => {
    await db.query(`DELETE FROM books`)
});

beforeEach(async () => {
    const book = await db.query(`INSERT INTO 
            books (isbn, amazon_url,author,language,pages,publisher,title,year)   
            VALUES(
            '123432122', 
            'https://amazon.com/taco', 
            'Elie', 
            'English', 
            100,  
            'Nothing publishers', 
            'my first book', 2008) 
            RETURNING *`)
    testBook = book.rows[0]

})

afterEach(async () => {
    await db.query(`DELETE FROM books`)
})
 
afterAll(async () => {
    await db.end()
})


describe("Get /books", () => {
    test("Get a list of all books", async() => {
        const res = await request(app).get('/books')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({books: [testBook]})
    })
})


describe("get /books/isbn", () => {
    test("get details about a specific book", async () => {
        const res = await request(app).get('/books/123432122')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({book: testBook})
    });
    test("get error from wrong book", async () => {
        const res = await request(app).get('/books/111')
        expect(res.statusCode).toBe(404)
    })
})


describe("Post /books", () => {
    test("Create a new book", async () => {
        const data = {isbn: "2293819", amazon_url: "http://test.com", author: "Ethan Degenhardt",
                        language: "russian", pages: 500, publisher: "great", title: "this book", year:2020}
        const res = await request(app).post("/books").send(data)
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({book: data})
    })
    test("Send nonvalid schema to post route", async () => {
        const data = {isbn: "2293819", amazon_url: "http://test.com", author: "Ethan Degenhardt",
                        language: "russian", pages: 500, publisher: "great", year:2020}
        const res = await request(app).post("/books").send(data)
        expect(res.statusCode).toBe(400)
    })
})

describe("PUT /books/isbn", () => {
    test('update book', async () => {
        const data = {amazon_url: "http://test.com", author: "Ethan Degenhardt",
        language: "russian", pages: 500, publisher: "great", title: "this book", year:2020}
        const res = await request(app).put('/books/123432122').send(data)
        expect(res.body.book).toHaveProperty("isbn");
        expect(res.body.book.title).toBe("this book");
    });
    test("update book wrong credentials", async () => {
        const data = {amazon_url: "http://test.com", author: "Ethan Degenhardt",
        language: "russian", pages: 500, publisher: "great", title: "this book", year:2020}
        const res = await request(app).put('/books/999999').send(data)
        expect(res.statusCode).toBe(404)
    })
})


describe("DELETE /books/isbn", () =>{
    test("delete book", async () => {
        const res = await request(app).delete("/books/123432122")
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({message: "Book deleted"})
    })
    test("delete book wrong credentials", async () => {
        const res = await request(app).delete("/books/123422")
        expect(res.statusCode).toBe(404);

    })
})