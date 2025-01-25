create database project;
use project;

create table actor (aID int auto_increment, aName varchar(50), primary key(aID));
create table director (dID int auto_increment, dName varchar (50), primary key(dID));
create table genre (gID int auto_increment, gName varchar (50), primary key(gID));
create table productionCompany (pID int auto_increment, pName varchar (255), primary key(pID));
create table movie (mID int auto_increment, mName varchar (255), yearOfRelease year, mDescription text, rating float, primary key(mID));
create table movie_actor (mID int, aID int, foreign key (mID) references movie(mID), foreign key (aID) references actor(aID));
create table movie_genre (mID int, gID int, foreign key (mID) references movie(mID), foreign key (gID) references genre(gID));
create table movie_director (mID int, dID int, foreign key (mID) references movie(mID), foreign key (dID) references director(dID));
create table movie_prodCoy (mID int, pID int, foreign key (mID) references movie(mID), foreign key (pID) references productionCompany(pID));	

-- insert movies with 1 actor, dorector, genre, production company
Delimiter $$
create procedure insert_movie(in m_name varchar(255), in m_releaseDate year, in m_desc text, in m_rating float, in m_actor varchar(50), in m_dir varchar(50), in m_genre varchar(50), in m_prodCoy varchar(255))
begin
	declare movID int;
	declare actID int;
    declare dirID int;
    declare genID int;
    declare prodCoyID int;
    
	insert into movie (mName, yearOfRelease, mDescription, rating) values (m_name, m_releaseDate, m_desc, m_rating);
	call findActor(m_actor, actID);
    call findDir(m_dir, dirID);
    call findGenre(m_genre, genID);
    call findProdCoy(m_prodCoy, prodCoyID);
    
    select mID into movID from movie where mName = m_name;
   
    insert into movie_actor values (movID, actID);
    insert into movie_director values (movID, dirID);
    insert into movie_genre values (movID, genID);
    insert into movie_prodCoy values (movID, prodCoyID);
end $$
delimiter ;

-- insert if they dont exist in their tables and then find their ids	
delimiter $$		
create procedure findActor(in m_actor varchar(50), out actID int)
begin
	if m_actor not in (select aName from actor) then
		insert into actor (aName) values (m_actor);
	end if;
    select aID into actID from actor where aName = m_actor;
end $$

create procedure findDir(in m_dir varchar(50), out dirID int)
begin
	if m_dir not in (select dName from director) then
		insert into director (dName) values (m_dir);
	end if;
    select dID into dirID from director where dName = m_dir;
end $$

create procedure findGenre(in m_genre varchar(50), out genID int)
begin
	if m_genre not in (select gName from genre) then
		insert into genre (gName) values (m_genre);
	end if;
    select gID into genID from genre where gName = m_genre;
end $$

create procedure findProdCoy(in m_prodCoy varchar(255), out prodCoyID int)
begin
	if m_prodCoy not in (select pName from productionCompany) then
		insert into productionCompany (pName) values (m_prodCoy);
	end if;
    select pID into prodCoyID from productionCompany where pName = m_prodCoy;
end $$
delimiter ;

-- add into relationship table by entering names and then inserting by id
delimiter $$
create procedure addMovieActor(in m_name varchar(255), in a_name varchar(50))
begin
	declare actID int;
    declare movID int;
    call findActor(a_name, actID);
    select mID into movID from movie where mName = m_name;
    insert into movie_actor values (movID, actID);
end $$

create procedure addMovieDirector(in m_name varchar(255), in d_name varchar(50))
begin
	declare dirID int;
    declare movID int;
    call findDir(a_name, dirID);
    select mID into movID from movie where mName = m_name;
    insert into movie_director values (movID, dirID);
end $$

create procedure addMovieGenre(in m_name varchar(255), in g_name varchar(50))
begin
	declare genID int;
    declare movID int;
    call findGenre(g_name, genID);
    select mID into movID from movie where mName = m_name;
    insert into movie_genre values (movID, genID);
end $$

create procedure addMovieProdCoy(in m_name varchar(255), in p_name varchar(50))
begin
	declare prodCoyID int;
    declare movID int;
    call findProdCoy(p_name, prodCoyID);
    select mID into movID from movie where mName = m_name;
    insert into movie_prodCoy values (movID, prodCoyID);
end $$
delimiter ;

-- ensure rows in relationship table with the movie key are deleted before movie is deleted
Delimiter $$
create trigger before_deleting_movie before delete on movie for each row 
begin
	delete from movie_actor where mID = OLD.mID;
    delete from movie_genre where mID = OLD.mID;
    delete from movie_director where mID = OLD.mID;
    delete from movie_prodCoy where mID = OLD.mID;
end $$
Delimiter ;

-- ensure the year of release of the movie is not in the future
Delimiter $$
create trigger before_movie_insert before insert on movie for each row
begin
	if new.yearOfRelease > year(curdate()) then
		signal sqlstate '45000' set message_text = 'Year of release cannot be in the future';
    end if;
end $$
Delimiter ;

-- ensure that actors, directors, genres and production companies with movies in the database are not deleted
Delimiter $$
create trigger before_actor_delete before delete on actor for each row
begin
	if old.aID in (select aID from movie_actor) then
    signal sqlstate '45000' set message_text = 'Actor with movie in the database cannot be deleted';
    end if;
end $$
delimiter ;

Delimiter $$
create trigger before_director_delete before delete on director for each row
begin
	if old.dID in (select dID from movie_director) then
    signal sqlstate '45000' set message_text = 'Director with movie in the database cannot be deleted';
    end if;
end $$
delimiter ;

Delimiter $$
create trigger before_genre_delete before delete on genre for each row
begin
	if old.gID in (select gID from movie_genre) then
    signal sqlstate '45000' set message_text = 'Genre with movie in the database cannot be deleted' ;
    end if;
end $$
delimiter ;

delimiter $$
create trigger before_prodCoy_delete before delete on productionCompany for each row
begin
	if old.pID in (select pID from movie_prodCoy) then
    signal sqlstate '45000' set message_text = 'Production Company with movie in the database cannot be deleted';
    end if;
end $$

delimiter ;

-- create fulltext indexing required to use match against function
create fulltext index index_mName on movie(mName);
create fulltext index index_aName on actor(aName);
create fulltext index index_dName on director(dName);
create fulltext index index_gName on genre(gName);

Delimiter $$
-- find and display movies according to the search
create procedure searchSuggestion(in searchTerm varchar(50))
begin
    -- Create a temporary table to store movie IDs
    create temporary table TempMovies (mID int);

    -- Insert matching movie IDs into the temporary table
    insert into TempMovies (mID)
    select mID from movie 
    where match(mName) against (searchTerm in natural language mode)
       or mName like concat('%', searchTerm, '%')
    union 
    select m.mID from movie m 
    join movie_actor ma on m.mID = ma.mID 
    join actor a on ma.aID = a.aID
    where match(aName) against (searchTerm in natural language mode)
       or aName like concat('%', searchTerm, '%')
    union 
    select m.mID from movie m 
    join movie_director md on m.mID = md.mID 
    join director d on md.dID = d.dID
    where match(dName) against (searchTerm in natural language mode)
       or dName like concat('%', searchTerm, '%')
    union 
    select m.mID from movie m 
    join movie_genre mg on m.mID = mg.mID 
    join genre g on mg.gID = g.gID
    where match(gName) against (searchTerm in natural language mode)
       or gName like concat('%', searchTerm, '%');
       
	call displayMovies();
    drop table TempMovies;
end $$

Delimiter ;

-- display the movies with given ids
Delimiter $$
create procedure displayMovies()
begin
    select 
        m.mName, m.yearOfRelease, m.rating,
        group_concat(distinct g.gName separator ', ') as genres,
        group_concat(distinct a.aName separator ', ') as actors,
        group_concat(distinct d.dName separator ', ') as directors,
        group_concat(distinct p.pName separator ', ') as productionCompanies
    from TempMovies tm join movie m on tm.mID = m.mID
    left join movie_genre mg on m.mID = mg.mID
    left join genre g on mg.gID = g.gID
    left join movie_actor ma on m.mID = ma.mID
    left join actor a on ma.aID = a.aID
    left join movie_director md on m.mID = md.mID
    left join director d on md.dID = d.dID
    left join movie_prodCoy mp on m.mID = mp.mID
    left join productionCompany p on mp.pID = p.pID
    group by 
        m.mID, m.mName, m.yearOfRelease, m.rating;
        
end $$

Delimiter ;

-- filter movies by year
delimiter $$
create procedure filterByYear(in movieYear year)
begin
	create temporary table TempMovies(mID int);
    insert into TempMovies (mID) select mID from movie where yearOfRelease = movieYear;
    call displayMovies();
    drop table TempMovies;
end $$
delimiter ;
