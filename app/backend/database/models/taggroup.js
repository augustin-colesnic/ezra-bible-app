/* This file is part of Ezra Bible App.

   Copyright (C) 2019 - 2023 Ezra Bible App Development Team <contact@ezrabibleapp.net>

   Ezra Bible App is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 2 of the License, or
   (at your option) any later version.

   Ezra Bible App is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with Ezra Bible App. See the file LICENSE.
   If not, see <http://www.gnu.org/licenses/>. */

'use strict';

/**
 * The TagGroup model is used to manage tag groups. Each tag can be associated to multiple tag groups.
 * @typedef TagGroup
 * @category Model
 */
module.exports = (sequelize, DataTypes) => {
  const TagGroup = sequelize.define('TagGroup', {
    title: DataTypes.STRING,
    count: DataTypes.VIRTUAL
  }, {});
  TagGroup.associate = function(models) {
    TagGroup.belongsToMany(models.Tag, {through: 'TagGroupMembers'});
  };

  TagGroup.findWithTagCount = function(bibleBookId=0) {
    var bookFilterQuery = '';
    var orderBy = 'tg.title ASC';

    if (bibleBookId != 0) {
      bookFilterQuery = `
        LEFT JOIN VerseTags vt ON vt.tagId = t.id
        LEFT JOIN VerseReferences vr ON vt.verseReferenceId = vr.id
        WHERE vr.bibleBookId = ${bibleBookId}
      `;

      orderBy = 'count DESC, tg.title ASC';
    }

    var query = `
      SELECT tg.*, COUNT(t.id) AS count FROM TagGroups tg
      LEFT JOIN TagGroupMembers tgm ON tgm.tagGroupId = tg.id
      LEFT JOIN Tags t ON tgm.tagId = t.id
      ${bookFilterQuery}
      GROUP BY tg.id
      ORDER BY ${orderBy}
    `;
    
    return sequelize.query(query, { model: global.models.TagGroup }); 
  };

  TagGroup.createTagGroup = async function(tagGroupTitle) {
    try {
      var newTagGroup = await global.models.TagGroup.create({
        title: tagGroupTitle
      });

      await global.models.MetaRecord.updateLastModified();

      return {
        success: true,
        dbObject: newTagGroup.dataValues,
      };

    } catch (error) {
      console.error('An error occurred while trying to save the new tag group: ' + error);

      return global.getDatabaseException(error);
    }
  };

  TagGroup.destroyTagGroup = async function(id) {
    try {
      await global.models.TagGroupMember.destroy({ where: { tagGroupId: id } });
      await global.models.TagGroup.destroy({ where: { id: id } });
      await global.models.MetaRecord.updateLastModified();

      return {
        success: true
      };

    } catch (error) {
      console.error('An error occurred while trying to delete the tag group with id ' + id + ': ' + error);

      return global.getDatabaseException(error);
    }
  };

  TagGroup.updateTagGroup = async function(id, title) {
    try {
      await global.models.TagGroup.update({ title: title }, { where: { id: id }});
      await global.models.MetaRecord.updateLastModified();

      return {
        success: true
      };

    } catch (error) {
      console.error("An error occurred while trying to update the tag group with id " + id + ": " + error);

      return global.getDatabaseException(error);
    }
  };

  return TagGroup;
};