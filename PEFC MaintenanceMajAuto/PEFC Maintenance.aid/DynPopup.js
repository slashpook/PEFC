// GZ : 08/01/2003
// Script permettant d'afficher de l'html dans une fenetre popup (section div).

//-----------------------------------------------------------------------------
// VARIABLES GLOBALES :
//-----------------------------------------------------------------------------

// Variables globales permettant de stocker la position de la souris lorsqu'elle passe au dessus d'un lien qui doit ouvrir une popup
var gPopupPosX = 0 ;
var gPopupPosY = 0 ;

// Variables globales contenant le nom de chaqune des sections DIV qui seront crées dans le document.
// Le nom des sections sera construit a partir des chaines suivante en y concatenant un index.
var gszDivSectionID			= 'DivSection'			;
var gszDivSectionShadowID	= 'DivSectionShadow'	;
var gszDivSectionTopicID	= 'DivSectionTopic'		;
var gszDivSectionIFrameID	= 'DivSectionIFrame'	;
var gszDivSectionIFrameName = 'DivSectionIFrameName';
var gszInvisibleIFrameName  = 'InvisibleIFrameName' ;

// chaine de caractere contenant le mode de split a utiliser ("bas" ou "haut")
var gszSplitMode = '';

// Tableau contenant les Url des documents HTML a afficher dans les sections DIV (le but etant de pouvoir afficher des pages html dans une popup)
var aDivSectionUrl = new Array();

// Variable globale contenant l'handler installé sur le document
var gOrignalOnMouseDownHandler = null;

//-----------------------------------------------------------------------------
// FONCTIONS A APPELER DEPUIS LE DOCUMENT HTML UTILISANT CE .js
//-----------------------------------------------------------------------------

// Fonction a appeler depuis la page HTML pour ouvrir une fenetre popup
// Ex : <a href="javascript:OpenPopup('contenu.htm');" id="UnIdentifiant" style="color: #00FF10;"> Libellé du lien </a>
// Le parametre Loc peut prendre 2 valeurs : "bas" ou "haut". Cela permet de designer la partie de la page a afficher.
function OpenPopup( szUrl, loc )
{
	var event = window.event ;
	gPopupPosX = event.clientX ;
	gPopupPosY = event.clientY ;

	gszSplitMode = loc ;

	// On crée la section DIV (la section n'est pas recrée si elle l'a deja été)
	var nSectionIndex = CreateOrGetIfExistDivSection( szUrl ) ;

	// On force l'actualisation de l'iframe : internet explorer bug
	getInvisibleSectionIFrame(nSectionIndex).document.location.href = getDivSectionUrl(nSectionIndex);

	// On attend le chargement de la page puis on affiche la section ( popup )
	WaitPopupLoadingAndDisplay( nSectionIndex ) ;
}

//-----------------------------------------------------------------------------
// FONCTIONS UTILITAIRES
//-----------------------------------------------------------------------------

// Handler permettant de cacher tous les popups lorsque l'utilisateur click que le parent
function OnParentMouseDownHandler( )
{	
	// On retablit le handler par original du document
	document.onmousedown = gOrignalOnMouseDownHandler;

	// Simply hide the popup
	HideAllDivSection();

	return true;
}

// Crée une section div contenant le contenu de l'url et retourne son index.
// Si la section a deja ete crée, on ne la recrée pas et on retourne son index
function CreateOrGetIfExistDivSection( szUrl ) 
{
	// On verifie que la section n'a pas deja ete crée.
	var nIndex = nSectionAlreadyCreated( szUrl ) ;
	if (  nIndex == -1 )
	{
		// On crée un nouvel index
		nIndex = nCreateNewSectionIndex( szUrl ) ;
		
		// Si elle n'est pas été crée, on la crée	
		var szSectionDiv;
		szSectionDiv		= "<DIV ID='" + getDivSectionID( nIndex ) + "' STYLE='position:absolute; top:-100; left:0; z-index:600; visibility:hidden;'>";
		szSectionDiv		+= "<DIV ID='" + getDivSectionShadowID(nIndex) + "' STYLE='position:absolute;top:0; left:0;  background-color:#C0C0C0;'></DIV>";
		szSectionDiv		+= "<DIV ID='" + getDivSectionTopicID(nIndex) + "' STYLE='position:absolute;top:0; left:0;  background-color:#FFFFFF;border:1px #000000 outset;width:200px; height:200px'>";
		szSectionDiv		+= "<IFRAME ID='" + getInvisibleIFrameName( nIndex ) + "' name='" + getInvisibleIFrameName(nIndex) + "' src = '" + getDivSectionUrl(nIndex) + "' STYLE='position:absolute;visibility:hidden;'></IFRAME>";
		szSectionDiv		+= "<IFRAME ID='" + getDivSectionIFrameID(nIndex) + "' name='" + getDivSectionIFrameName(nIndex) + "' src='about:blank' frameborder=0 scrolling=auto width=100% height=100%></IFRAME>";
		szSectionDiv		+= "</DIV></DIV>";

		// On ecrit la section dans le document
		var objBody = document.all.tags("BODY")[0];
		if( typeof(objBody) != "object" )
			return;
		objBody.innerHTML += (szSectionDiv);
	//	objBody.insertAdjacentHTML("beforeEnd", szSectionDiv);
	}

	// On retourne l'index
	return nIndex ;
}

// Affiche une section a l'emplacement determiné par les valeurs globales gPopupPosX et gPopupPosY (affecté lorsque la souris passe au dessus du lien clické)
function DisplaySection( nSectionIndex ) 
{
	// Determine la position de la fenetre popup
	var top = 0;
	var left = 0;

	var size = new CreateSize( 100, 100 ) ;
	ComputeOptimalWindowSize( window.getDivSectionIFrame(nSectionIndex), size ) ;

	var nWidth = size.x ; 
	var nHeight = size.y; 

	var nCurrentDocWidth = document.body.clientWidth ;
	var nCurrentDocHeight = document.body.clientHeight ;

	if (gPopupPosY + nHeight + 20 < nCurrentDocHeight + document.body.scrollTop) {
		top = document.body.scrollTop + gPopupPosY - nHeight;
	} else {
		top = (document.body.scrollTop + nCurrentDocHeight) - nHeight - 20;
	}

	if (gPopupPosX + nWidth + 20 < nCurrentDocWidth + document.body.scrollLeft) {
		left = document.body.scrollLeft + gPopupPosX - nWidth;
	} else {
		left = (document.body.scrollLeft + nCurrentDocWidth) - nWidth - 20;
	}
	
	if (top < document.body.scrollTop ) top  = document.body.scrollTop + 1;
	if (left< document.body.scrollLeft) left = document.body.scrollLeft + 1;

	// Positionne le topic a la bonne place et change sa taille
	window.getDivSectionStyle(nSectionIndex).left = left;
	window.getDivSectionStyle(nSectionIndex).top = top;
	window.getDivSectionTopicStyle(nSectionIndex).width = nWidth ;
	window.getDivSectionTopicStyle(nSectionIndex).height = nHeight ;

	// Positionne l'ombre a la bonne place et change sa taille
	window.getDivSectionShadowStyle(nSectionIndex).width = nWidth ;
	window.getDivSectionShadowStyle(nSectionIndex).height = nHeight ;
	window.getDivSectionShadowStyle(nSectionIndex).left = 5;
	window.getDivSectionShadowStyle(nSectionIndex).top = 5;
	window.getDivSectionStyle(nSectionIndex).visibility = "visible";

	ChangeAllTarget(getDivSectionIFrame(nSectionIndex).document);
	getDivSectionIFrame(nSectionIndex).document.body.onclick = OnPopupMouseDown;

	// on sauvegarde l'handler sur onmousedown du document
	if (gOrignalOnMouseDownHandler == null)
		gOrignalOnMouseDownHandler = document.onmousedown;

	// on remplace l'handler onmousedown sur le document par mon handler => Permet de 
	// detecter lorsque le popup devra etre rendu invisible (qd l'utilisateur click en dehors du popup)
	document.onmousedown = OnParentMouseDownHandler;
	
}

// Permet de récuperer le nom du document affiché dans la section div situé a l'index nIndex du tableau d'url
function getDivSectionUrl( nIndex )
{
	// Si l'index est plus grand que la tableau on retourne NULL
	if (nIndex == -1 || aDivSectionUrl.length <= nIndex) 
		return null;
	// Sinon on retourne la chaine contenu dans le tableau
	else 
		return aDivSectionUrl[nIndex];
}

// Fonction permettant de récuperer le nom de la section DIV à partir d'un index
function getDivSectionID( nIndex )
{
	return gszDivSectionID + nIndex;
}

// Fonction permettant de récuperer le nom de la section DIV d'ombre à partir d'un index
function getDivSectionShadowID( nIndex )
{
	return gszDivSectionShadowID + nIndex;
}

// Fonction permettant de récuperer le nom de la section DIV topic à partir d'un index
function getDivSectionTopicID( nIndex )
{
	return gszDivSectionTopicID + nIndex;
}

// Fonction permettant de récuperer le nom de la section DIV contenant la frame à partir d'un index
function getDivSectionIFrameID( nIndex )
{
	return gszDivSectionIFrameID + nIndex;
}

// Fonction permettant de récuperer le nom de la section DIV contenant le de la frame à partir d'un index
function getDivSectionIFrameName( nIndex )
{
	return gszDivSectionIFrameName + nIndex;
}

// Fonction permettant de recuperer de nom de l'iframe invisible contenant la totalité de la page chargé.
function getInvisibleIFrameName( nIndex )
{
	return gszInvisibleIFrameName + nIndex ;
}


// Retoune le style correspondant a la section DIV du topic
function getDivSectionTopicStyle(nIndex)
{
	return eval("document.all['" + getDivSectionTopicID(nIndex) + "']").style;
}

// Retoune le style correspondant a la section DIV de l'ombre
function getDivSectionShadowStyle(nIndex)
{
	return eval("document.all['" + getDivSectionShadowID(nIndex) + "']").style;
}

// Retoune le style correspondant a la section DIV de plus haut niveau (c'est sur elle que l'on change le flag de visibility
function getDivSectionStyle(nIndex)
{
	return eval("document.all['" + getDivSectionID(nIndex) + "']").style;
}

// Retoune le style correspondant a la section DIV du topic
function getDivSectionIFrameStyle(nIndex)
{
	return eval("document.all['" + getDivSectionIFrameName(nIndex) + "'].style");
}

// Retourne la frame contenu dans le div de l'index passé en parametre
function getDivSectionIFrame(nIndex)
{
	return eval("document.frames['" + getDivSectionIFrameName(nIndex) + "']");
}

// Retourne la frame contenu dans le div de l'index passé en parametre
function getInvisibleSectionIFrame(nIndex)
{
	return eval("document.frames['" + getInvisibleIFrameName(nIndex) + "']");
}

// Recupere la fenetre frame popup actuellement visible
function getCurrentDivSectionIFrame()
{
	var i = 0;
	for (i = 0; i < aDivSectionUrl.length; i ++)
		if (getDivSectionStyle(i).visibility == "visible")
			return getDivSectionIFrame(i);
	return null;
}

// Permet de savoir si une section contenant l'url passé en parametre a deja ete chargée
function nSectionAlreadyCreated( szUrl ) 
{
	var i = 0;
	for (i = 0; i < aDivSectionUrl.length; i++ )
		// On retourne l'index dans le tableau si on trouve l'url
		if (aDivSectionUrl[i] == szUrl) 
			return i;

	// Retourner -1 signifie que la section contenant ce document n'a jamais ete crée
	return -1;
}

// Permet de créer un nouvell index à partir s'une Url passée en paramétre.
function nCreateNewSectionIndex( szUrl )
{
	var i = 0; 
	for (i = 0; i < aDivSectionUrl.length; i++ ) 
	{
		if (aDivSectionUrl[i] == null) {
			aDivSectionUrl[i] = szUrl;
			return i;
		}
	}
	aDivSectionUrl[i] = szUrl;
	return i;
}

// Permet de masquer toutes les sections DIV qui ont été crée dans ce document
function HideAllDivSection( ) 
{
	var i = 0; 
	// Rend toutes les sections DIV invisibles
	for (i = 0; i < aDivSectionUrl.length; i++ )
		getDivSectionStyle(i).visibility = "hidden";
}

// Constructeur permettant de créer un objet Size avec 2 membres : x et y 
function CreateSize( x, y )
{
	this.x = x;
	this.y = y;
}

// fonction permettant de calculer la taille optimal de la fenetre.
// Pour cela on part la taille maximum et on fait une dichtomie pour
// trouver la taille ideal
function ComputeOptimalWindowSize(win, size)
{
	// On recupere la taille du document principal
	var nMainDocWidth = document.body.clientWidth ;
	var nMainDocHeight = document.body.clientHeight ;

	var ratio = nMainDocHeight / nMainDocWidth;

	var maxSize = new CreateSize(0,0);
	maxSize.x = nMainDocWidth  * 0.85 ;
	maxSize.y = nMainDocHeight * 0.85 ;

	if (ratio > 0.6)
		maxSize.y = maxSize.x * 0.6;
	else
		maxSize.x = maxSize.y / 0.6;

	var miny = win.document.body.scrollHeight + 16;

	if (miny <= maxSize.y)
	{
		if (win.document.body.scrollWidth > maxSize.x) 
		{
			size.x = nMainDocWidth * 0.85; 
			size.y = miny;	
			win.document.body.style.overflow='auto';
//			win.document.body.scroll = 'yes';

		}
		else 
		{
			offx = -maxSize.x/2;
			BinaryDivideAndResize( win , size, maxSize.x, miny, 0.6 ) ;
		}
	}
	else 
	{
		win.resizeTo(nMainDocWidth * 0.85 , win.document.body.scrollHeight + 16);		
		miny = 	win.document.body.scrollHeight + 16;
		maxy = nMainDocHeight * 0.85;
		
		if (miny > maxy) 
		{ 
			miny = maxy;
			size.x = nMainDocWidth * 0.85;
			size.y = maxy;
			win.document.body.style.overflow='auto';
//			win.document.body.scroll = 'yes';
		}
		else {
			size.y = miny;
			offx = -nMainDocWidth * 0.85/2;
			BinaryDivideAndResize( win, size, nMainDocWidth * 0.85,  miny, ratio ) ;
		}
	}

	win.resizeTo(size.x, size.y);
	return;
}

function BinaryDivideAndResize( win, size, x, miny ,ratio )
{
	while (true)
	{
		x = x + offx;
		win.resizeTo(x, miny);
		win.resizeTo(x, miny);
		offy = win.document.body.scrollHeight + 16 - x * ratio;
		if (offy >  3 )
			offx = Math.abs(offx) / 2;
		else if (offy < -3 )
			offx = -Math.abs(offx) /2;
		else
			break;
		if (Math.abs(offx) < 3)
			break;
	}
	size.x = win.document.body.scrollWidth;
	size.y = win.document.body.scrollHeight;
	win.document.body.style.overflow='hidden';
//	win.document.body.scroll = 'no';
}

// Attend le chargement de la page popup
function WaitPopupLoadingAndDisplay(nIndexSection)
{

	if ( getInvisibleSectionIFrame( nIndexSection ).document.readyState == "complete" ) 
	{
		// On ne garde que la partie du bas de la page ou la partie du haut.
		SplitPage( gszSplitMode, nIndexSection ) ; 

		// On affiche la page.
		DisplaySection( nIndexSection ) ;

	} else 
	{
		setTimeout("WaitPopupLoadingAndDisplay(" + nIndexSection + ")", 100);
	}
}

function ChangeAllTarget(tagsObject)
{
	var A = tagsObject.all.tags("A");
	ChangeTarget(A);

	var IMG = tagsObject.all.tags("IMG");
	ChangeTarget(IMG);
}

function ChangeTarget(colls)
{
	var j = 0;
	if (colls != null) 
	{
		for (j = 0; j < colls.length; j ++ )
		{
			var strtemp = colls[j].href;
			strtemp = strtemp.toLowerCase();
			if (strtemp.indexOf("javascript:") == -1)
				colls[j].target = "_parent";
		}
	}
}

function OnPopupMouseDown()
{
	var divSectionIFrame = getCurrentDivSectionIFrame();

	if (divSectionIFrame == null)
		return true;

	// Si on a clické sur un lien alors on cache les div ouvert
	if (!((divSectionIFrame.window.event != null) && (divSectionIFrame.window.event.srcElement != null) &&
		 ((divSectionIFrame.window.event.srcElement.tagName == "A") || (divSectionIFrame.window.event.srcElement.tagName == "IMG")))) 
	{
		document.onmousedown = gOrignalOnMouseDownHandler;

		HideAllDivSection();

		return true;
	}
}

function SplitPage( szSplitMode, nIndexSection )
{	
	// On recupere le source entier de la page a charger.
	var srcHTML = getInvisibleSectionIFrame( nIndexSection ).document.body.parentNode.outerHTML;

	if ( szSplitMode == "bas" )
	{
		// On extrait la partie du bas de cette page
		//srcHTML = srcHTML.substring(0,srcHTML.indexOf("<!-- MILIEU -->") ) + "</body></html>";
		srcHTML = srcHTML; //srcHTML.substring( srcHTML.indexOf("<!-- DEBUTBAS -->"), srcHTML.indexOf("<!-- FINBAS -->") ) ;
	}
	else if ( szSplitMode == "haut" )
	{
		srcHTML = srcHTML.substring( srcHTML.indexOf("<!-- DEBUTHAUT -->"), srcHTML.indexOf("<!-- FINHAUT -->") ) ;
	}

	// On met le contenu de la sous chaine dans la section div a afficher
	getDivSectionIFrame( nIndexSection ).document.body.innerHTML = srcHTML;
	getDivSectionIFrameStyle( nIndexSection ).display = "block";
	getDivSectionStyle( nIndexSection ).display = "block";
	getDivSectionShadowStyle( nIndexSection ).display = "block";
	getDivSectionTopicStyle( nIndexSection ).display = "block";
}
