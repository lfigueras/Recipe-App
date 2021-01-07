// Global app controller

var searchItem = document.querySelector('.search__field')
var searchForm = document.querySelector('.search')
var recipeColumn = document.querySelector('.results__list')
var displayColumn = document.querySelector('.recipe')
var addToCart = document.querySelector('.btn-small.recipe__btn')
var shoppingListColumn = document.querySelector('.shopping')
var buttonDiv = document.querySelector('.results__pages')
var recipeList , currentRecipe , ingredientItem
var pages = []


const searchRecipe = async function(query){
    let result = await fetch(`https://forkify-api.herokuapp.com/api/search?q=${query}`)
    return result.json()
}

const getRecipe = async function(id) {
    let result = await fetch(`https://forkify-api.herokuapp.com/api/get?rId=${id}`)
    return result.json()
}
// ====================================================================================================================================
//                                                        SEARCH CLICK
// ====================================================================================================================================

searchForm.onsubmit = async function (e) {
        // Function gets triggered once user submits search
        // Empties the recipe Column
        recipeColumn.innerHTML = ''

        e.preventDefault()
        recipeList= await searchRecipe(searchItem.value)
        recipeList = recipeList.recipes
        
        for (let i = 0 ; i < Math.ceil(recipeList.length / 10); i++) {
            if ( (i+1) === Math.ceil(recipeList.length / 10)) {
                pages[i] = recipeList.slice(i,i+(recipeList.length % 10))
            } else {
                pages[i] = recipeList.slice(i,i+10)
            }
        }

        appendResultsList(pages)
}
// ====================================================================================================================================
//                                                        RECIPE CLICK
// ====================================================================================================================================

var hasPreviews = false
document.querySelector('.results__list').onclick = async function(e) {

    function checkStat(status) {
        return new Promise((resolve,reject) => {
            if (status === true) {
                resolve (true)
            } else {
                reject (false)
            }
        })
    }

    async function update(){
        try {
            hasPreviews = await checkStat(hasPreviews)
            displayColumn.innerHTML = ' '
            document.querySelector('.results__link--active').classList.remove('results__link--active')
        } catch (err){
            hasPreviews = false
        }
    }

    e.preventDefault()
    hasPreviews = true
    update()

    // Access Recipe List
    let n = (e.path[2].className === 'results__link') ? 2:0;

    //story current class
    e.path[n].classList.add('results__link--active')
    let recipeID = e.path[n].href.split("#")
    await newRecipe(recipeID[1])

}

// ====================================================================================================================================
//                                        CLASS DECLARATIONS: RECIPEDISPLAY , INGREDIENT
// ====================================================================================================================================

class recipeDisplay {
    
    constructor(currentRecipe,ingredients) {
        // this.content = contains object currentRecipe
        // this.ingredientList = contains array of ingredients
        this.content = currentRecipe
        this.ingredientList = ingredients
    
    }
    isMeasured(text){
        // Checks whether the item is to be measured
        // Split the content 
        // let ingredientContent = e.split(' ')

        let status = (isNaN(parseFloat(text[0].charAt(0)))) ? false: true;
        return status
    }

    getUnit(text) {
        // This function gets the unit by: Splitting the sentence into words then checks for the first string then returns it.

        for (let i = 0 ; i < text.length ; i++) {
            // Once a text is seen, it returns the value
            if(isNaN(parseFloat(text[i])) && (text[i] !== '') && (text[i] !== ' ')){
                return text[i]
            } else if ((text[i] == '') || (text[i] == ' ') ) {
                text.splice(i,1)
                i--
            } else if (this.isDashed(text[i])){
                return text[i]
            }
        }
    }

    isDashed(item){
        // CHECK FOR PRESENCE OF DASH
        // 1. Split the word per character
        var content = item.split('')

        // 2. IF '-' found; returns TRUE
        for( let i = 0; i < content.length ; i++){
            if (content[i] == '-' && (!isNaN(content[i+1]))) { 
                return true 
            } else if (content[i] == '-' && (isNaN(content[i+1]))) {
                return 'dashed unit'
            }
        
        return false
         }
    }

    getValue(text) {   
        // Check whether the ingredient has dash or not
        // Only takes in the first word
        if (this.isDashed(text[0]) === true && this.isMeasured === true) {
            // WITH DASH
            // If it contains a dash- it splits the text and stores in an array
            // Return added value of the stored value
            text = text[0].split('-')
            return (eval(text[0]) + eval(text[1])).toFixed(1)
        } else {
            // WITHOUT DASH 
            // Checks whether there is only one value to be added
            // isNaN(parseFloat(text[1]) checks whether second content of the array is a potential value
            if (isNaN(parseFloat(text[1]))){
                if(!isNaN((text[0]))){
                    return eval(text[0]).toFixed(1)
                } else {
                    return 1
                }
            } else if (this.isDashed(text[0]) === false && this.isMeasured === true) {
                return text[0]
            } else {
                return (eval(text[0]) + eval(text[1])).toFixed(1)
            }
        }
    }

    getItemDescription(content){
        // this function removes the parenthesis of the string 
        let start = content.split("(")[0]
        let end = content.split(")")[1]
        return (end === undefined) ? start:`${start} ${end}`
    }

    getItem(content,unit){
        // call get item description to remove all the close parenthesis
        // for items with no unit, no need to split
        // for items with unit, take the second part of the splitted string
        return (unit === '')? this.getItemDescription(content) : this.getItemDescription(content).split(unit)[1]
    }

    calcTime() {
        // Assuming that we need 15 min for each 3 ingredients
        const numIng = this.content.ingredients.length;
        const periods = Math.ceil(numIng / 3);
        this.time = periods * 15;
    }
    
  }
  class ingredient extends recipeDisplay {

    constructor(content,currentRecipe,ingredients){
        // =============================================================================================
        // Constructor Description
        // =============================================================================================
        // this.content = contains the whole object
        // this.description = Ingredient Description in full form (includes measurement and item)
        // this.isMeasured = Checks whether the product contains measurements (e.g: cups, tbsp,tsp)
        // this.unit = checks for unit (e.g: cups, tbsp,tsp)
        // this.value = takes in the total value in decimals('1.5, 1.33'); rounded to one decimal place
        // this.item = holds produc description
        // =============================================================================================

        super(currentRecipe,ingredients)

        this.content = currentRecipe
        this.description = content
        this.textContent = this.getItemDescription(content).split(' ')
        this.isMeasured = this.isMeasured(this.textContent)
        this.servings = null
        // Based on whether it's measured or not, the program will take the ingredient's unit and value 

        if(this.isMeasured == true){ 
            this.unit = this.getUnit(this.textContent)
            this.value = this.getValue(this.textContent)
        } else {
            this.unit = ''
            this.value = 1
        } 

        this.item = this.getItem(this.description,this.unit)        
    }

    updateValue(action,servings) {
        if (action === 'add'){
            this.value = ((servings / 4) * this.value).toFixed(2)
        } else if (action === 'minus') {
            this.value = ((this.value / ((servings+4)/ 4)).toFixed(2))
        }
    }
}


// ==================================================================================================================================================================
//                                                       FUNCTIONS
// ==================================================================================================================================================================

const newRecipe = async function (id) {

    currentRecipe = await getRecipe(id)
    let title = currentRecipe.recipe
    let ingredients = currentRecipe.recipe.ingredients

    // Create SUPER Class/ General Class 
    currentRecipe = new recipeDisplay(title,ingredients)
    
    // Creates ingredientItem Class
    ingredientItem = []
    currentRecipe.ingredientList.forEach((e,index) => {
        ingredientItem[index] = new ingredient(e)
    })
    // Append Display
    appendRecipeHeader(currentRecipe.content)
    appendRecipeDetails(currentRecipe,ingredientItem)
    appendIngredients(ingredientItem)
}

const appendResultsList= async function (item) {
    buttonDiv.innerHTML = ''
    let pages = item 
    let maxPages = item.length
    var currentPage = 1

    // Default Body 

        pages[currentPage - 1].forEach((item) => {
            returnPageContent(item)
        })

        buttonDiv.insertAdjacentHTML( 'beforeend', 
        `
            <button class="btn-inline results__btn--prev">
            </button>

            <button class="btn-inline results__btn--next">
                <span>Page 2</span>
                <svg class="search__icon">
                    <use href="img/icons.svg#icon-triangle-right"></use>
                </svg>
            </button>
        `)
    

    // On-Click Functions 
    let nextButton = document.querySelector('.results__btn--next')
    let previousButton = document.querySelector('.results__btn--prev')

    nextButton.onclick = async function (){
        if(currentPage < maxPages && currentPage > 0 ){
            currentPage +=1
            nextButton.querySelector('span').innerHTML = `Page ${currentPage + 1}`
            previousButton.innerHTML =                    
            `<svg class="search__icon">
                <use href="img/icons.svg#icon-triangle-left"></use>
            </svg>
            <span>Page ${currentPage - 1 }</span>`

            nextPage(item,currentPage)
        } 
    }
    
    previousButton.onclick = async function (){
        console.log(currentPage)
        
        if (currentPage > 2) {
            currentPage -=1
            previousButton.querySelector('span').innerHTML = `Page ${currentPage - 1}`
        } else if (currentPage == 2) { 
            currentPage -=1
            previousButton.innerHTML = ' '}

        nextButton.querySelector('span').innerHTML = `Page ${currentPage + 1}`
        prevPage(item,currentPage)
    }

    // Adjust
    const nextPage = async function(page,currentPage) {
        recipeColumn.innerHTML = ' '
        page[currentPage-1].forEach((item) => {
            returnPageContent(item)
        })
    }

    const prevPage = async function(page,currentPage) {
        recipeColumn.innerHTML = ' '
        page[currentPage-1].forEach((item) => {
            returnPageContent(item)
        })
    }

}

const returnPageContent = async function (item){
            let newHTML = 
            `<li>
                <a class="results__link" href="#${item.recipe_id}">
                    <figure class="results__fig">
                        <img src="${item.image_url}" alt="Test">
                    </figure>
                    <div class="results__data">
                        <h4 class="results__name">${item.title}</h4>
                        <p class="results__author">${item.publisher}</p>
                    </div>
                </a>
            </li>`

        recipeColumn.insertAdjacentHTML('beforeend', newHTML)
}
const appendRecipeHeader = async function (item){
    let headerHTML = 
    `
    <figure class="recipe__fig">
                <img src="${item.image_url}" alt="Tomato" class="recipe__img">
                <h1 class="recipe__title">
                    <span>${item.title}</span>
                </h1>
    </figure>
    `
    displayColumn.insertAdjacentHTML('beforeend',headerHTML)
}
const appendRecipeDetails = async function (item , ingredient) {
    item.calcTime()
    let recipe_infoHTML = 
    `
    <div class="recipe__details">
    <div class="recipe__info">
        <svg class="recipe__info-icon">
            <use href="img/icons.svg#icon-stopwatch"></use>
        </svg>
        <span class="recipe__info-data recipe__info-data--minutes">${item.time}</span>
        <span class="recipe__info-text"> minutes</span>
    </div>
    <div class="recipe__info">
        <svg class="recipe__info-icon" >
            <use href="img/icons.svg#icon-man"></use>
        </svg>
        <span class="recipe__info-data recipe__info-data--people">4</span>
        <span class="recipe__info-text"> servings</span>

        <div class="recipe__info-buttons">
            <button class="btn-tiny" id = "minus">
                <svg>
                    <use href="img/icons.svg#icon-circle-with-minus"></use>
                </svg>
            </button>
            <button class="btn-tiny" id = "plus">
                <svg>
                    <use href="img/icons.svg#icon-circle-with-plus"></use>
                </svg>
            </button>
        </div>

        </div>
        <button class="recipe__love">
            <svg class="header__likes">
                <use href="img/icons.svg#icon-heart-outlined"></use>
            </svg>
        </button>
    </div>

    <div class="recipe__ingredients">
        <ul class="recipe__ingredient-list">
        </ul>
        <button class="btn-small recipe__btn">
        <svg class="search__icon">
            <use href="img/icons.svg#icon-shopping-cart"></use>
        </svg>
        <span>Add to shopping list</span>
    </button>
    </div>

     <div class="recipe__directions">
                <h2 class="heading-2">How to cook it</h2>
                <p class="recipe__directions-text">
                    This recipe was carefully designed and tested by
                    <span class="recipe__by">${item.content.publisher}</span>. Please check out directions at their website.
                </p>
                <a class="btn-small recipe__btn" href="${item.content.source_url}" target="_blank">
                    <span>Directions</span>
                    <svg class="search__icon">
                        <use href="img/icons.svg#icon-triangle-right"></use>
                    </svg>

                </a>
                
            </div>
    `
    displayColumn.insertAdjacentHTML('beforeend',recipe_infoHTML)
    

    // ON-CLICK BUTTONS
    // checks whether add or minus button is clicked 
    // creates and ingredient.serving property to save serving
    let add = document.getElementById('plus')
    let minus = document.getElementById('minus')
    let servings = document.querySelector('.recipe__info-data--people')
    let like = document.querySelector ('.recipe__love')
    let likeList = document.querySelector('.likes__list')
    const baseTime = item.time
    ingredient.servings = eval(servings.innerHTML)

        add.onclick = async function (){
            if(ingredient.servings >= 4 && ingredient.servings <= 12 ) {
            ingredient.servings = eval(ingredient.servings) + 4
            servings.innerHTML = ingredient.servings 

            // Update the instruction list 
                ingredient.forEach ((item,index) => {
                    ingredient[index].updateValue('add',ingredient.servings)
                })
                appendIngredients(ingredient)
                
                item.time = (item.time * (ingredient.servings / 4))
                document.querySelector('.recipe__info-data--minutes').innerHTML = item.time
            }
        }

        minus.onclick = async function (){
            if(ingredient.servings > 4) {
            ingredient.servings = eval(ingredient.servings) - 4
            servings.innerHTML = ingredient.servings             

            // Update instruction list
            ingredient.forEach ((item,index) => {
                ingredient[index].updateValue('minus',ingredient.servings)
            })
            appendIngredients(ingredient)
            item.time = (baseTime *  (ingredient.servings / 4)) 
            document.querySelector('.recipe__info-data--minutes').innerHTML = item.time
            }
        }

        like.onclick = async function () {
            // Updates the like list by adding the liked recipe to the end of list
            document.querySelector('.likes__list').insertAdjacentHTML('beforeend',
            `
            <li>
                <a class="likes__link" href="#${item.content.recipe_id}">
                    <figure class="likes__fig">
                        <img src="${item.content.image_url}" alt="Test">
                    </figure>
                    <div class="likes__data">
                        <h4 class="likes__name">${item.content.title}</h4>
                        <p class="likes__author">${item.content.publisher}</p>
                    </div>
                </a>
            </li>
        `)
        }

        likeList.onclick = async function (e) {
            // Take in Recipe ID -> Find Matching ID -> Clear Display HTML -> Display Recipe
            let recipeID = e.path[2].hash.split('#')[1]
            // Stored Value = '#1132' to remove the # -> use Split

            for( i = 0 ; i < recipeList.length ; i++) {
            if (recipeList[i].recipe_id === recipeID){
                    displayColumn.innerHTML = ''
                    await newRecipe(recipeID)
                }
            }
        }
 // ==================================================================================================================================================================
                                                    // SHOPPING BUTTON CLICK
// =================================================================================================================================================================

        // SHOPPING LIST RECIPE BUTTON 

        let shoppingButton = document.querySelector('.recipe__btn')

        shoppingButton.onclick = async function () {
            shoppingListColumn.innerHTML = `
            <ul class="shopping__list">
            </ul>`
            appendShoppingList(ingredient)

            //delete button

            document.onclick = async function (e) {
                if(e.path[1].classList[0] === 'shopping__delete'){
                    e.path[2].remove()
                }
            }
        }
    }
const appendIngredients = async function(ingredient){
    document.querySelector('.recipe__ingredient-list').innerHTML = ' '
    ingredient.forEach((item,index) => {
        if (item.item != ' '){
            let newIngredient = 
            `
            <li class="recipe__item">
                <svg class="recipe__icon">
                    <use href="img/icons.svg#icon-check"></use>
                </svg>
                <div class="recipe__count">${item.value}</div>
                <div class="recipe__ingredient">
                    <span class="recipe__unit">${item.unit}</span>
                    ${item.item}
                </div>
            </li>
            `
            document.querySelector('.recipe__ingredient-list').insertAdjacentHTML('beforeend',newIngredient)
    
        }
    })
}

const appendShoppingList = async function(ingredient){
    ingredient.forEach((item,index) => {
        let shoppingList = `
        <li class="shopping__item">
            <div class="shopping__count">
                <input type="number" value="${item.value}" step="0.1">
                <p>${item.unit}</p>
            </div>
            <p class="shopping__description">${item.item}</p>
            <button class="shopping__delete btn-tiny">
                <svg>
                    <use href="img/icons.svg#icon-circle-with-cross"></use>
                </svg>
            </button>
        </li>
        `
        document.querySelector('.shopping__list').insertAdjacentHTML('beforeend',shoppingList)
    
    })
}
