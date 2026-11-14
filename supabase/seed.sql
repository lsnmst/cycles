insert into islands(sort_order,name,description) values
(1,'Castagno','Suolo acido, semi-ombra. Castagno, nocciolo, sambuco; ginestra, ortica e consolida per la fertilità.'),
(2,'Noce isolato','Isolata per il juglone. Sotto la chioma solo specie tolleranti; foglie compostate a parte.'),
(3,'Sole e secco','Versante sud, drenante, suolo povero e ghiaioso. Nessun concime.'),
(4,'Umida e ombrosa','Sorgente, fossato o avvallamento. Da costruire solo con acqua disponibile.'),
(5,'Orto-siepe','Siepe con aiuole ai piedi. Isola più produttiva nei primi due anni; ruotare Apiacee, Asteracee, Fabacee.'),
(6,'Melo e pero','Versante soleggiato, pH 6–7. File sulla curva di livello, 4–5 m, due varietà con fioritura sovrapposta.'),
(7,'Ciliegio e susino','Sud, riparato dal gelo tardivo. Potatura in estate dopo la raccolta.'),
(8,'Mirtilli','Suolo acido, pH 4,5–5,5, vicino al castagno. Pacciame di conifera, acqua piovana.'),
(9,'Bacche in mezz''ombra','Sotto siepe di nocciolo e corniolo: ribes, uva spina, lampone, mora, fragola di bosco.'),
(10,'Muro caldo e pergola','Vite PIWI, fico, cachi, kiwi baby; sotto lavanda, salvia, timo, nasturzio, trifoglio.');

insert into species(scientific_name,common_name) values
('Achillea millefolium','Achillea'),('Pimpinella anisum','Anice'),('Artemisia absinthium','Assenzio'),('Borago officinalis','Borragine'),
('Diospyros kaki','Cachi'),('Calendula officinalis','Calendula'),('Matricaria chamomilla','Camomilla'),('Castanea sativa','Castagno'),
('Cicer arietinum','Ceci'),('Prunus avium','Ciliegio'),('Allium schoenoprasum','Cipollina'),('Symphytum officinale','Consolida'),
('Cornus mas','Corniolo'),('Phaseolus vulgaris','Fagiolo'),('Petasites albus','Farfaraccio bianco'),('Ficus carica','Fico'),
('Foeniculum vulgare','Finocchio'),('Fragaria vesca','Fragola'),('Cytisus scoparius','Ginestra dei carbonai'),('Genista tinctoria','Ginestra dei tintori'),
('Hypericum perforatum','Iperico'),('Actinidia arguta','Kiwi baby'),('Rubus idaeus','Lampone'),('Lactuca sativa','Lattuga'),
('Lavandula angustifolia','Lavanda'),('Humulus lupulus','Luppolo'),('Malus domestica','Melo'),('Vaccinium corymbosum','Mirtillo'),
('Narcissus spp.','Narcisi'),('Corylus avellana','Nocciolo'),('Juglans regia','Noce'),('Hippophae rhamnoides','Olivello spinoso'),
('Origanum vulgare','Origano'),('Urtica dioica','Ortica'),('Pyrus communis','Pero'),('Petroselinum crispum','Prezzemolo'),
('Ribes nigrum','Ribes nero / rosso / uva spina'),('Salix spp.','Salice'),('Alnus glutinosa','Ontano nero'),('Salvia officinalis','Salvia'),
('Sambucus nigra','Sambuco nero'),('Prunus domestica','Susino'),('Trifolium repens','Trifoglio bianco'),('Valeriana officinalis','Valeriana'),
('Vitis vinifera','Vite resistente (PIWI)'),('Vitex agnus-castus','Agnocasto'),('Crocus sativus','Zafferano'),('Prunus spinosa','Prugnolo'),
('Colutea arborescens','Vescicaria'),('Melissa officinalis','Melissa'),('Malva sylvestris','Malva'),('Tussilago farfara','Tossilagine'),
('Hedera helix','Edera'),('Marrubium vulgare','Marrubio'),('Ruta graveolens','Ruta'),('Rosa canina','Rosa canina'),('Crataegus monogyna','Biancospino');

insert into island_species(island_id,species_id,role)
select i.id,s.id,v.r from (values
(1,'Castanea sativa','struttura'),(1,'Corylus avellana','struttura'),(1,'Sambucus nigra','struttura'),(1,'Cytisus scoparius','azotofissatore'),(1,'Genista tinctoria','azotofissatore'),(1,'Urtica dioica','accumulatore'),(1,'Symphytum officinale','accumulatore'),(1,'Hypericum perforatum','strato basso'),(1,'Melissa officinalis','strato basso'),(1,'Malva sylvestris','strato basso'),(1,'Hedera helix','copertura'),(1,'Tussilago farfara','copertura'),(1,'Achillea millefolium','bordo soleggiato'),(1,'Origanum vulgare','bordo soleggiato'),(1,'Salvia officinalis','bordo soleggiato'),
(2,'Juglans regia','struttura'),(2,'Urtica dioica','strato basso'),(2,'Malva sylvestris','strato basso'),(2,'Sambucus nigra','strato basso'),(2,'Hedera helix','strato basso'),
(3,'Cornus mas','struttura'),(3,'Prunus spinosa','struttura'),(3,'Colutea arborescens','azotofissatore'),(3,'Genista tinctoria','azotofissatore'),(3,'Salvia officinalis','strato basso'),(3,'Lavandula angustifolia','strato basso'),(3,'Origanum vulgare','strato basso'),(3,'Achillea millefolium','strato basso'),(3,'Marrubium vulgare','strato basso'),(3,'Ruta graveolens','strato basso'),(3,'Artemisia absinthium','strato basso'),(3,'Foeniculum vulgare','annuale/biennale'),(3,'Pimpinella anisum','annuale/biennale'),(3,'Vitex agnus-castus','opzionale'),(3,'Crocus sativus','opzionale'),
(4,'Salix spp.','struttura'),(4,'Alnus glutinosa','azotofissatore'),(4,'Urtica dioica','accumulatore'),(4,'Symphytum officinale','accumulatore'),(4,'Valeriana officinalis','strato basso'),(4,'Petasites albus','strato basso'),(4,'Tussilago farfara','strato basso'),(4,'Hedera helix','copertura'),
(5,'Corylus avellana','siepe'),(5,'Sambucus nigra','siepe'),(5,'Rosa canina','siepe'),(5,'Crataegus monogyna','siepe'),(5,'Humulus lupulus','rampicante'),(5,'Phaseolus vulgaris','azotofissatore'),(5,'Cicer arietinum','azotofissatore'),(5,'Borago officinalis','impollinatori'),(5,'Calendula officinalis','impollinatori'),(5,'Matricaria chamomilla','impollinatori'),(5,'Petroselinum crispum','aromatiche/ortive'),(5,'Lactuca sativa','aromatiche/ortive'),(5,'Melissa officinalis','aromatiche/ortive'),
(6,'Malus domestica','struttura'),(6,'Pyrus communis','struttura'),(6,'Hippophae rhamnoides','accumulatore'),(6,'Trifolium repens','strato basso'),(6,'Symphytum officinale','strato basso'),(6,'Allium schoenoprasum','impollinatori'),(6,'Narcissus spp.','impollinatori'),(6,'Calendula officinalis','impollinatori'),(6,'Achillea millefolium','impollinatori'),(6,'Borago officinalis','impollinatori'),
(7,'Prunus avium','struttura'),(7,'Prunus domestica','struttura'),(7,'Fragaria vesca','strato basso'),(7,'Symphytum officinale','strato basso'),
(8,'Vaccinium corymbosum','struttura'),(8,'Cytisus scoparius','azotofissatore'),(8,'Fragaria vesca','strato basso'),
(9,'Corylus avellana','siepe'),(9,'Cornus mas','siepe'),(9,'Ribes nigrum','strato basso'),(9,'Rubus idaeus','strato basso'),(9,'Symphytum officinale','accumulatore'),(9,'Borago officinalis','accumulatore'),(9,'Melissa officinalis','accumulatore'),
(10,'Vitis vinifera','struttura'),(10,'Ficus carica','struttura'),(10,'Diospyros kaki','struttura'),(10,'Actinidia arguta','struttura'),(10,'Lavandula angustifolia','strato basso'),(10,'Salvia officinalis','strato basso'),(10,'Trifolium repens','strato basso')
) v(n,sci,r) join islands i on i.sort_order=v.n join species s on s.scientific_name=v.sci;

-- Calendario dalla tabella riassuntiva del PDF (intervalli di mesi, anche a cavallo d'anno)
insert into species_calendar(species_id,activity,month)
select distinct s.id,v.act,((v.a-1+g)%12)+1 from (values
('Achillea millefolium','trapianto',3,3),('Achillea millefolium','trapianto',10,10),('Achillea millefolium','raccolta',5,9),('Achillea millefolium','divisione',3,3),('Achillea millefolium','divisione',10,10),
('Pimpinella anisum','semina',4,4),('Pimpinella anisum','raccolta',8,9),('Artemisia absinthium','trapianto',3,4),('Artemisia absinthium','raccolta',6,9),
('Borago officinalis','semina',3,4),('Borago officinalis','raccolta',5,10),('Calendula officinalis','semina',3,4),('Calendula officinalis','raccolta',5,10),
('Castanea sativa','trapianto',11,2),('Castanea sativa','innesto',3,4),('Castanea sativa','raccolta',10,10),('Castanea sativa','potatura',11,2),
('Symphytum officinale','talea',1,2),('Symphytum officinale','divisione',10,11),('Symphytum officinale','potatura',5,8),
('Cornus mas','trapianto',11,2),('Cornus mas','raccolta',9,9),('Corylus avellana','trapianto',10,2),('Corylus avellana','raccolta',9,9),
('Lavandula angustifolia','trapianto',3,3),('Lavandula angustifolia','talea',7,8),('Lavandula angustifolia','raccolta',6,7),
('Salvia officinalis','trapianto',3,3),('Salvia officinalis','talea',6,7),('Salvia officinalis','raccolta',4,5),('Salvia officinalis','raccolta',8,8),
('Sambucus nigra','talea',12,2),('Sambucus nigra','raccolta',5,6),('Sambucus nigra','raccolta',9,9),
('Urtica dioica','divisione',3,4),('Urtica dioica','raccolta',5,9),('Origanum vulgare','divisione',3,3),('Origanum vulgare','divisione',10,10),('Origanum vulgare','raccolta',6,8),
('Hypericum perforatum','semina',3,3),('Hypericum perforatum','raccolta',6,7),('Valeriana officinalis','divisione',3,4),('Valeriana officinalis','raccolta',10,10),
('Malus domestica','trapianto',11,3),('Malus domestica','innesto',3,4),('Malus domestica','potatura',12,2),('Malus domestica','raccolta',8,10),
('Pyrus communis','trapianto',11,3),('Pyrus communis','innesto',3,4),('Pyrus communis','potatura',12,2),('Pyrus communis','raccolta',8,10),
('Prunus avium','trapianto',11,2),('Prunus avium','raccolta',6,7),('Prunus avium','potatura',7,8),
('Vaccinium corymbosum','trapianto',3,3),('Vaccinium corymbosum','trapianto',10,10),('Vaccinium corymbosum','raccolta',7,8),
('Vitis vinifera','potatura',1,2),('Vitis vinifera','raccolta',9,10),('Crocus sativus','trapianto',9,9),('Crocus sativus','raccolta',10,11),
('Fragaria vesca','trapianto',3,3),('Fragaria vesca','trapianto',9,9),('Fragaria vesca','raccolta',5,6),
('Cytisus scoparius','semina',3,4),('Cytisus scoparius','potatura',6,8)
) v(sci,act,a,b) join species s on s.scientific_name=v.sci cross join generate_series(0,((v.b-v.a)+12)%12) g;
