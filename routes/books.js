const express = require("express");
const router = express.Router();
const Author = require("../models/author");
const Book = require("../models/book");
const imageMimeTypes = ["image/jpeg", "image/png", "images/gif"];

// All Books Route
router.get("/", async (req, res) => {
  let query = Book.find();
  if (req.query.title != null && req.query.title !== "") {
    query = query.regex("title", new RegExp(req.query.title, "i"));
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore !== "") {
    query = query.lte("publishDate", req.query.publishedBefore);
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter !== "") {
    query = query.gte("publishDate", req.query.publishedAfter);
  }

  try {
    const books = await query.exec();
    res.render("books/index", {
      books: books,
      searchOptions: req.query,
    });
  } catch {
    res.render("books/index", {
      books: [],
      errorMessage: "Error retrieving books",
    });
  }
});

// New Book Route
router.get("/new", async (req, res) => {
  renderNewPage(res, new Book());
});

// Create Book Route
router.post("/", async (req, res) => {
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    description: req.body.description,
  });

  saveCover(book, req.body.cover);

  try {
    const newBook = await book.save();
    res.redirect(`books/${newBook.id}`);
  } catch {
    renderNewPage(res, book, "Could not create book");
  }
});

// Show Book Route
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("author").exec();
    res.render("books/show", { book: book });
  } catch {
    res.render("books/show", {
      book: null,
      errorMessage: "Could not find book",
    });
  }
});

// Edit Book Route
router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    renderEditPage(res, book);
  } catch {
    res.render("books/edit", {
      book: null,
      errorMessage: "Could not find book to edit",
    });
  }
});

// Update Book Route
router.put("/:id", async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);
    book.title = req.body.title;
    book.author = req.body.author;
    book.publishDate = new Date(req.body.publishDate);
    book.pageCount = req.body.pageCount;
    book.description = req.body.description;
    if (req.body.cover != null && req.body.cover !== "") {
      saveCover(book, req.body.cover);
    }
    await book.save();
    res.redirect(`/books/${book.id}`);
  } catch {
    if (book != null) {
      renderEditPage(res, book, "Could not update book");
    } else {
      res.render("books/edit", {
        book: null,
        errorMessage: "Book not found for update",
      });
    }
  }
});

// Delete Book Page
router.delete("/:id", async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);
    await book.deleteOne();
    res.redirect("/books");
  } catch {
    res.render("books/show", {
      book: book,
      errorMessage: "Could not remove book",
    });
  }
});

async function renderNewPage(res, book, errorMessage = "") {
  renderFormPage(res, book, "new", errorMessage);
}

async function renderEditPage(res, book, errorMessage = "") {
  renderFormPage(res, book, "edit", errorMessage);
}

async function renderFormPage(res, book, form, errorMessage = "") {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book,
    };
    if (errorMessage) {
      params.errorMessage = errorMessage;
    }
    res.render(`books/${form}`, params);
  } catch {
    res.redirect("/books", {
      errorMessage: "Error rendering form page",
    });
  }
}

function saveCover(book, coverEncoded) {
  if (coverEncoded == null || coverEncoded === "") return;
  try {
    const cover = JSON.parse(coverEncoded);
    if (cover != null && imageMimeTypes.includes(cover.type)) {
      book.coverImage = new Buffer.from(cover.data, "base64");
      book.coverImageType = cover.type;
    }
  } catch (error) {
    console.error("Error parsing cover image data: ", error.message);
  }
}

module.exports = router;
