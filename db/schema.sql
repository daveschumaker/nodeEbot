-- ---
-- Globals
-- ---

-- SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
-- SET FOREIGN_KEY_CHECKS=0;

-- ---
-- Table 'word_dictionary'
-- 
-- ---

-- DROP TABLE IF EXISTS word_dictionary;
    
CREATE TABLE word_dictionary (
  keyword TEXT,
  next_1 TEXT,
  next_2 TEXT,
  next_3 TEXT,
  prev_1 TEXT,
  prev_2 TEXT,
  prev_3 TEXT,
  KEY (keyword)
);

-- ---
-- Table 'start_words'
-- 
-- ---

-- DROP TABLE IF EXISTS start_words;
    
CREATE TABLE start_words (
  word TEXT,
  KEY (word)
);

-- ---
-- Table 'end_words'
-- 
-- ---

-- DROP TABLE IF EXISTS end_words;
    
CREATE TABLE end_words (
  word TEXT,
  KEY (word)
);

-- ---
-- Table 'hashtags'
-- 
-- ---

-- DROP TABLE IF EXISTS hashtags;
    
CREATE TABLE hashtags (
  word TEXT,
  KEY (word)
);

-- ---
-- Foreign Keys 
-- ---


-- ---
-- Table Properties
-- ---

-- ALTER TABLE word_dictionary ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE start_words ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE end_words ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE hashtags ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ---
-- Test Data
-- ---

--- INSERT INTO word_dictionary (id,keyword,next_1,next_2,next_3,prev_1,prev_2,prev_3) VALUES
--- ('','','','','','','','');
-- INSERT INTO start_words (id,word) VALUES
-- ('','');
-- INSERT INTO end_words (id,word) VALUES
-- ('','');
-- INSERT INTO hashtags (id,word) VALUES
-- ('','');