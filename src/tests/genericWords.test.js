import chai from 'chai';
import { forIn, forEach, isEqual } from 'lodash';
import SortingDirections from 'src/../functions/src/backend/shared/constants/sortingDirections';
import {
  approveGenericWord,
  getGenericWords,
  getGenericWord,
  updateGenericWord,
  deleteGenericWord,
} from './shared/commands';
import {
  AUTH_TOKEN,
  GENERIC_WORD_KEYS,
  INVALID_ID,
  NONEXISTENT_ID,
} from './shared/constants';
import { expectUniqSetsOfResponses, expectArrayIsInOrder } from './shared/utils';
import { malformedGenericWordData, updatedGenericWordData } from './__mocks__/documentData';

const { expect } = chai;

describe('MongoDB Generic Words', () => {
  describe('/PUT mongodb genericWords', () => {
    it('should update specific genericWord with provided data', (done) => {
      getGenericWords()
        .then((res) => {
          expect(res.status).to.equal(200);
          updateGenericWord({ id: res.body[0].id, ...updatedGenericWordData })
            .end((_, result) => {
              expect(result.status).to.equal(200);
              forIn(updatedGenericWordData, (value, key) => {
                expect(isEqual(result.body[key].toString(), value.toString())).to.equal(true);
              });
              done();
            });
        });
    });

    it('should return a generic word error because of malformed data', (done) => {
      getGenericWords()
        .then((res) => {
          expect(res.status).to.equal(200);
          updateGenericWord({ id: res.body[0].id, ...malformedGenericWordData })
            .end((_, result) => {
              expect(result.status).to.equal(400);
              done();
            });
        });
    });

    it('should return a generic word because document doesn\'t exist', (done) => {
      getGenericWord(INVALID_ID)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should throw an error for providing an invalid id', (done) => {
      updateGenericWord({ id: INVALID_ID })
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should update the updatedOn field', (done) => {
      getGenericWords()
        .then((genericWordsRes) => {
          expect(genericWordsRes.status).to.equal(200);
          const genericWord = genericWordsRes.body[0];
          updateGenericWord({ ...genericWord, word: 'updated' })
            .end((_, res) => {
              expect(res.status).to.equal(200);
              expect(Date.parse(genericWord.updatedOn)).to.be.lessThan(Date.parse(res.body.updatedOn));
              done();
            });
        });
    });
  });

  describe('/GET mongodb genericWords', () => {
    it.skip('should return a generic word by searching', (done) => {
      const keyword = 'mbughari';
      getGenericWords({ keyword })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);
          expect(res.body[0].word).to.equal(keyword);
          done();
        });
    });

    it.skip('should return a generic word using definition by searching with filter query', (done) => {
      const filter = 'aal';
      getGenericWords({ filter: `{"word":"${filter}"}` })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);
          expect(res.body[0].definitions.includes(filter)).to.equal(true);
          done();
        });
    });

    it('should return all generic words', (done) => {
      getGenericWords()
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.lengthOf(10);
          forEach(res.body, (genericWords) => {
            expect(genericWords).to.have.all.keys(GENERIC_WORD_KEYS);
          });
          done();
        });
    });

    it('should be sorted by number of approvals', (done) => {
      getGenericWords()
        .then((res) => {
          expect(res.status).to.equal(200);
          approveGenericWord(res.body[0])
            .then(() => {
              getGenericWords()
                .end((_, result) => {
                  expect(result.status).to.equal(200);
                  expectArrayIsInOrder(result.body, 'approvals', SortingDirections.DESCENDING);
                  done();
                });
            });
        });
    });

    it('should return a single generic word', (done) => {
      getGenericWords()
        .then((res) => {
          expect(res.status).to.equal(200);
          const firstGenericWord = res.body[0];
          getGenericWord(firstGenericWord.id)
            .end((_, result) => {
              expect(result.status).to.equal(200);
              expect(result.body).to.be.an('object');
              expect(isEqual(result.body, firstGenericWord)).to.equal(true);
              done();
            });
        });
    });

    it('should return an error for incorrect generic word id', (done) => {
      getGenericWords()
        .then(() => {
          getGenericWord(NONEXISTENT_ID)
            .end((_, result) => {
              expect(result.status).to.equal(404);
              expect(result.error).to.not.equal(undefined);
              done();
            });
        });
    });

    it('should return an error because document doesn\'t exist', (done) => {
      getGenericWord(INVALID_ID)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should return at most twenty five generic words per request with range query', (done) => {
      Promise.all([
        getGenericWords({ range: true }),
        getGenericWords({ range: '[10,34]' }),
        getGenericWords({ range: '[35,59]' }),
      ]).then((res) => {
        expectUniqSetsOfResponses(res, 25);
        done();
      });
    });

    it('should return at most four generic words per request with range query', (done) => {
      getGenericWords({ range: '[5,8]' })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.lengthOf.at.most(4);
          done();
        });
    });

    it('should return at most thirty generic words because of a large range', (done) => {
      getGenericWords({ range: '[10,39]' })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.lengthOf.at.most(30);
          done();
        });
    });

    it('should return at most ten generic words because of a tiny range', (done) => {
      getGenericWords({ range: '[10,9]' })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.lengthOf.at.most(10);
          done();
        });
    });

    it('should throw an error due to an invalid range', (done) => {
      getGenericWords({ range: 'incorrect' })
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should return different sets of generic words for pagination', (done) => {
      Promise.all([
        getGenericWords({ range: '[0,9]' }),
        getGenericWords({ range: [10, 19] }),
        getGenericWords({ range: '[20,29]' }),
        getGenericWords({ range: '[30,39]' }),
      ]).then((res) => {
        expectUniqSetsOfResponses(res);
        done();
      });
    });

    it('should return different sets of generic words for pagination with page numbers', function (done) {
      this.timeout(15000);
      Promise.all([
        getGenericWords({ page: 0 }),
        getGenericWords({ page: 1 }),
        getGenericWords({ page: 2 }),
      ]).then((res) => {
        expectUniqSetsOfResponses(res);
        done();
      });
    });

    it('should return prioritize range over page', (done) => {
      Promise.all([
        getGenericWords({ page: '1' }),
        getGenericWords({ page: '1', range: '[100,109]' }),
      ]).then((res) => {
        expect(isEqual(res[0].body, res[1].body)).to.equal(false);
        done();
      });
    });

    it('should return a descending sorted list of generic words with sort query', (done) => {
      const key = 'word';
      const direction = SortingDirections.DESCENDING;
      getGenericWords({ sort: `["${key}", "${direction}"]` })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expectArrayIsInOrder(res.body, key, direction);
          done();
        });
    });

    it('should return an ascending sorted list of generic words with sort query', (done) => {
      const key = 'definitions';
      const direction = SortingDirections.ASCENDING;
      getGenericWords({ sort: `["${key}", "${direction}"]` })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expectArrayIsInOrder(res.body, key, direction);
          done();
        });
    });

    it('should throw an error due to malformed sort query', (done) => {
      const key = 'wordClass';
      getGenericWords({ sort: `["${key}]` })
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should throw an error due to invalid sorting ordering', (done) => {
      const key = 'word';
      getGenericWord({ sort: `["${key}", "invalid"]` })
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should throw an error for providing an invalid id', (done) => {
      getGenericWord(INVALID_ID)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });
  });

  describe('/DELETE mongodb genericWords', () => {
    it('should delete an existing generic word', (done) => {
      getGenericWords()
        .then((res) => {
          expect(res.status).to.equal(200);
          const firstGenericWord = res.body[0];
          deleteGenericWord(firstGenericWord.id)
            .then((deleteRes) => {
              expect(deleteRes.status).to.equal(200);
              getGenericWord(firstGenericWord.id)
                .end((_, searchGenericWordRes) => {
                  expect(searchGenericWordRes.status).to.equal(404);
                  expect(searchGenericWordRes.body.error).to.not.equal(undefined);
                  done();
                });
            });
        });
    });

    it('should return an error for attempting to deleting a non-existing generic word', (done) => {
      deleteGenericWord(INVALID_ID)
        .then((deleteRes) => {
          expect(deleteRes.status).to.equal(400);
          done();
        });
    });

    it('should throw an error for providing an invalid id', (done) => {
      deleteGenericWord(INVALID_ID)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should throw an error for invalid user permissions', (done) => {
      deleteGenericWord(INVALID_ID, { token: AUTH_TOKEN.MERGER_AUTH_TOKEN })
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });
  });
});
