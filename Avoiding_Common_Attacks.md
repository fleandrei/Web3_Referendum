# Avoiding Commons Attacks 

## Introduction

La DAO Web3 Direct Democracy ne fait pas intervenir de transfert d’ether et DemoCoin, l’utility token de la DAO, ne permet à ses détenteurs que de participer à l’élaboration des propositions de loi. L’appât du gain n’est donc pas directement un motive d’attaque pour notre projet. Cela peut, en revanche être le cas de manière indirecte dans la mesure où les institutions et/ou Dapp qui sont sous la gouvernance de la DAO peuvent être liés à des activités lucratives susceptibles d’être détournées à des fins de profit personnel.  

Les attaques peuvent en outre viser à manipuler les résultats des processus de gouvernance, à les perturber ou les bloquer, à acquérir des DemoCoin de manière indue...
Les voies d’attaques sont nombreuses et ce document vise à présenter les mesures qui ont été prises dans le but d’éviter les plus communes d’entre elles.

## Droits d’accès 

Le projet implémente un système de droit d’exécutions des fonction d’état qui permette d’éviter les comportements anormale. Il y a ainsi 4 droits d’accès correspondant à des modifiers spécifiques:

 * _Citizens Only_ : Seuls les citoyens sont autorisés à exécuter la fonction. Les citoyens sont des comptes enregistrés dans le contrat Citizens_Register et qui ont de ce fait le droit de participer à la vie politique de la DAO. Ce modifier est essentiellement utilisé pour l’élaboration des propositions de lois dans l’Agora ainsi que pour l’élection des membres des délégations
 * _Constitution Only_ : Seuls le contrat Constitution est autorisé à exécuter la fonction. Il s’agit généralement de fonction visant à modifier les paramètres du contrat.
 * _Delegation Only_ : Utilisé au sein d’un contrat Delegation seul les membres de la délégation ont le droit d’appeler la fonction. Cela est utilisé pour les fonctions ayant attrait à l’élaboration de projets de loi par la délégation.
 * _Authorities Only_ : Les contrats de type Register possèdent une liste d’adresses (Register_Authorities) correspondants aux contrats ayant le droit d’interagir avec eux. Seuls ces contrats peuvent faire appel aux fonctions ayant le modifier Authorities_Only. 


On peut constater que les contrats de type register (Constitution, API_Register, Loi et Citizens_Register) ne peuvent être appelés que par l’Agora, les Delegation et la Constitution. Il n’est donc pas possible pour un citoyen d’interagir directement avec ces contrats. Ils doivent pour cela passer par les contrats de gouvernance que sont l’Agora et les Delegation. Cela permet d’isoler les données d’intérêt de la DAO, contenues dans les register ; de l'ensemble des citoyens. 
Par ailleurs, étant donné que la majorité des fonctions du projet sont soumises à l’un de ces modifier, il est difficile pour un compte étranger à la DAO d’interagir avec elle. 

## Blocage

L’attaquant peut vouloir bloquer ou perturber le bon fonctionnement de la DAO. Il peut notamment vouloir bloquer le processus de création d’une loi si cette dernière ne lui convient pas. 
Le projet n’est pas soumis aux risques de blocages liés au transfert d’ether mais d’autres formes de blocages peuvent se produire.

Prenons par exemple le contrats Majority_Judgment_Ballot.sol qui peut gérer plusieurs scrutins (ballots) relatifs à plusieurs contrats de gouvernance différents (Agora ou Délégations). Ces scrutins sont identifiés sur le contrat via une clé « key » (bytes32 choisit par le contrat de gouvernance) au sein d’un mapping. Un attaquant pourrait bloquer un contrat de gouvernance en l’empêchant de lancer un scrutin sur Majority_Judgment_Ballot en lançant avant lui un scrutin ayant la même clé. Pour éviter cette attaque, nous avons fait en sorte que les clés des scrutins fournies par les contrats de gouvernance ne puissent pas être calculées à l’avance avant la création du scrutin. Pour cela, la clé est obtenue en hashant un élément fixe (ex : l’identifiant de la proposition de loi) avec le timestamps du bloc auquel le scrutin est crée. 


Par ailleurs, les blocages peuvent aussi intervenir sans nécessairement d’intentions malveillantes. Cela peut par exemple arriver lorsqu’une proposition a été votée et qu’il faut exécuter ses function call. Il est possible que la quantité de gas à dépenser pour exécuter toutes les function calls soit trop élevée pour un seul compte ou au sein d’une seule transaction (notamment si la limite de gas du block est dépassée). Pour pallier à cela, il est possible pour un compte de choisir le nombre de function calls qu’il souhaite exécuter et de laisser le reste aux autres comptes. De plus, l’utilisation de call pour exécuter les function call permet d’éviter que la transaction soit revert s'il y a un problème avec les function call. Ainsi, si un de ces derniers venait à revert, les function call qui suivent pourront être exécuté sans problème. Les valeurs succès et receipt renvoyés par les appels avec call sont stockés pour chaque function call. Cela permet d’auditer par la suite quels function call ont été revert et pourquoi. 


En règle générale, les processus d’élaboration et de vote de loi, que ce soit via l’Agora ou les Délégations, sont segmentés en différentes étapes ou stages (représentés par une enum). Le passage d’un stage à l’autre est soumis à certaines conditions, mais peut être activé par n’importe quel compte ayant pouvoir sur l’élaboration de la loi en question (citoyen pour les propositions de loi et membre de délégation pour les projets de loi) sous réserve que ces conditions soient respectées. Il en est de même pour l’élection des membres de délégations. Le fait qu’à aucun moment, la progression dans les processus de la DAO ne soit conditionnée à l’action d’un seul compte permet d’éviter les blocages.


## Réentrance :
Les mécanismes de droits d’accès ainsi que de partitionnement des process d’élaboration et de vote des lois en stages dont nous avons parlé dans les sections précédentes permettent de rendre les attaques de réentrances plus compliquées. 

En parallèle, nous avons suivi, lorsque cela était possible, le schéma « Checks-effects-interaction » dans nos fonctions. Une majorité des interactions se font entre des contrats connus, cependant il y a deux situations à risques qu’il faut surveiller :


 * _Interaction avec des contrats IVote et IDelegation_ : Pour permettre aux utilisateurs d’adapter la DAO à leur use case, nous leur avons laissé la liberté d’implémenter les contrats de vote et de délégation selon leur besoin (nous avons néanmoins fournit une implémentation pour chacun deux) à conditions qu’ils respectent leur interfaces respectives : IVote et IDelegation. 

Au long de la vie d’un projet, plusieurs contrats de ce type peuvent être rajoutés à la DAO. Cela qui peut constituer un risque de réentrance dans la mesure où ces contrats customisés peuvent cacher des failles de sécurité, volontairement introduite ou non par leur créateur. Cela peut être d’autant plus dangereux que les citoyens ne sont pas tous nécessairement qualifiés pour juger de la sécurité des smart contrats dont ils doivent voter l’adoption. D’où la nécessiter d’utiliser le schéma « Checks-effects-interaction » pour les fonctions interagissant avec ces contrats.

 * _Interaction avec les contrats référencés par le API_Register_ : Les tiers contrats avec lesquels on peut interagir via le contrat API_Register sont ajoutés à ce dernier via un processus démocratique. Cependant, comme nous l’avons vu précédemment, il n’est pas impossible que certaines failles pouvant mener à des attaques par réentrances échappent au contrôle citoyen. C’est pourquoi nous utilisons le modifier nonReentrant de la bibliothèque ReentrancyGuard pour les fonctions Execute_Law des contrat Agora et Delegation. En effet, ces fonctions sont les seules susceptibles de faire appel à la fonction Execute_Function du contrat API_Register qui est chargée d’interagir avec les tiers contrats externes à la DAO.  


## Libraries sécurisées

Nous avons utilisé lorsque cela était possible et souhaitable, des libraries externes sécurisées d'OppenZeppelin. Concrètement, nous avons utilisé deux libraries :

 * _ReentrancyGuard_ : Comme nous l’avons présenté précédemment dans la section Reentrancy
 * _EnumerableSet_ : Permet d’éditer facilement des listes de bytes32, de uint ou d’adresses. Lorsque le projet nécessitait des listes d’éléments d’autre types (comme par exemple dans le contrat API_Register qui nécessite des listes de bytes4), nous les avons implémentés en nous inspirant du schéma utilisé dans la library.

Nous avions également dans l’idée d’utiliser la bibliothèque SafeMath pour permettre d’effectuer des opérations sur les entiers sans overflow. Cependant, les version 0.8. du compilateur solidity prend désormais en charge cet aspect. 



