/**
 * Utility class for building Mongoose queries with
 * pagination, search, sorting, and field selection.
 */
class APIFeatures {
  /**
   * @param {import('mongoose').Query} query - Mongoose query object.
   * @param {object} queryString - Express req.query object.
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /** Full-text search on the `title` field. */
  search() {
    if (this.queryString.search) {
      const keyword = {
        title: {
          $regex: this.queryString.search,
          $options: 'i',
        },
      };
      this.query = this.query.find(keyword);
    }
    return this;
  }

  /** Comma-separated field sorting, e.g. ?sort=-createdAt,title */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /** Comma-separated field selection, e.g. ?fields=title,summary */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  /** Page-based pagination. ?page=2&limit=10 */
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = APIFeatures;
