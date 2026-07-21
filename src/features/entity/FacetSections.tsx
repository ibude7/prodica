import type { IdentifiedEntity } from '../../domain/types'
import { SectionCard } from '../../components/SectionCard'
import { FieldRow, LabelValueGrid, ListBlock } from './fieldUi'

export function FacetSections({ entity }: { entity: IdentifiedEntity }) {
  switch (entity.kind) {
    case 'food': {
      const f = entity.facets
      return (
        <>
          <SectionCard title="Composition">
            <FieldRow label="Ingredients" value={f.ingredients} />
            <FieldRow label="Contents" value={f.contents} />
            <FieldRow label="Origin" value={f.origin} />
            <FieldRow label="Storage" value={f.storage} />
            {f.allergens?.length ? (
              <div className="stack">
                <span className="field-label">Allergens</span>
                <ListBlock items={f.allergens} />
              </div>
            ) : null}
          </SectionCard>
          <SectionCard title="Nutrition">
            <LabelValueGrid rows={f.nutritionFacts} />
            {!f.nutritionFacts?.length ? (
              <p className="muted">No nutrition facts listed.</p>
            ) : null}
          </SectionCard>
          <SectionCard title="Pairings" variant="muted">
            <ListBlock items={f.pairings} />
            {f.doNotPair?.length ? (
              <div className="stack">
                <span className="field-label">Caution</span>
                <ListBlock items={f.doNotPair} />
              </div>
            ) : null}
            {!f.pairings?.length && !f.doNotPair?.length ? (
              <p className="muted">No pairing tips.</p>
            ) : null}
          </SectionCard>
        </>
      )
    }
    case 'alcohol': {
      const f = entity.facets
      return (
        <>
          <SectionCard title="Drink details">
            <FieldRow
              label="ABV"
              value={f.abv != null ? `${f.abv}%` : null}
            />
            <FieldRow label="Style" value={f.style} />
            <FieldRow label="Region" value={f.region} />
            <FieldRow label="Grapes / grains" value={f.grapesOrGrains} />
            <FieldRow label="Serving temp" value={f.servingTemp} />
            <FieldRow label="Contents" value={f.contents} />
            <FieldRow label="Origin" value={f.origin} />
            <FieldRow label="Ingredients" value={f.ingredients} />
          </SectionCard>
          <SectionCard title="Tasting & pairings" variant="muted">
            <ListBlock items={f.tastingNotes} />
            <ListBlock items={f.pairings} />
          </SectionCard>
        </>
      )
    }
    case 'medicine': {
      const f = entity.facets
      return (
        <SectionCard title="Medicine details" variant="safety">
          <FieldRow label="Form" value={f.form} />
          <FieldRow label="Contents" value={f.contents} />
          <FieldRow label="Dosage" value={f.dosage} />
          <FieldRow label="Storage" value={f.storage} />
          <div className="stack">
            <span className="field-label">Active ingredients</span>
            <ListBlock items={f.activeIngredients} />
          </div>
          <div className="stack">
            <span className="field-label">Contraindications</span>
            <ListBlock items={f.contraindications} />
          </div>
          <div className="stack">
            <span className="field-label">Side effects</span>
            <ListBlock items={f.sideEffects} />
          </div>
        </SectionCard>
      )
    }
    case 'supplement': {
      const f = entity.facets
      return (
        <SectionCard title="Supplement details">
          <FieldRow label="Dosage" value={f.dosage} />
          <FieldRow label="Contents" value={f.contents} />
          <ListBlock items={f.activeIngredients} />
          <ListBlock items={f.benefits} />
          <ListBlock items={f.warnings} />
        </SectionCard>
      )
    }
    case 'cosmetic': {
      const f = entity.facets
      return (
        <SectionCard title="Cosmetic details">
          <FieldRow label="Ingredients" value={f.ingredients} />
          <FieldRow label="Usage" value={f.usage} />
          <FieldRow label="Contents" value={f.contents} />
          <ListBlock items={f.skinTypes} />
          <ListBlock items={f.claims} />
        </SectionCard>
      )
    }
    case 'household': {
      const f = entity.facets
      return (
        <SectionCard title="Household product">
          <FieldRow label="Use case" value={f.useCase} />
          <FieldRow label="Ingredients" value={f.ingredients} />
          <FieldRow label="Contents" value={f.contents} />
          <ListBlock items={f.surfaces} />
          <ListBlock items={f.safetyNotes} />
        </SectionCard>
      )
    }
    case 'book': {
      const f = entity.facets
      return (
        <SectionCard title="Book">
          <FieldRow label="Authors" value={f.authors.join(', ') || null} />
          <FieldRow label="ISBN" value={f.isbn} />
          <FieldRow label="Publisher" value={f.publisher} />
          <FieldRow
            label="Year"
            value={f.year != null ? String(f.year) : null}
          />
          <FieldRow
            label="Pages"
            value={f.pages != null ? String(f.pages) : null}
          />
          <FieldRow label="Genre" value={f.genre.join(', ') || null} />
          <FieldRow label="Synopsis" value={f.synopsis} />
          <ListBlock items={f.themes} />
        </SectionCard>
      )
    }
    case 'movie': {
      const f = entity.facets
      return (
        <SectionCard title="Movie">
          <FieldRow
            label="Year"
            value={f.year != null ? String(f.year) : null}
          />
          <FieldRow label="Directors" value={f.directors.join(', ') || null} />
          <FieldRow label="Cast" value={f.cast.join(', ') || null} />
          <FieldRow label="Genre" value={f.genre.join(', ') || null} />
          <FieldRow
            label="Runtime"
            value={
              f.runtimeMinutes != null ? `${f.runtimeMinutes} min` : null
            }
          />
          <FieldRow label="Synopsis" value={f.synopsis} />
          <FieldRow label="Known for" value={f.whereKnownFor} />
        </SectionCard>
      )
    }
    case 'tv_show': {
      const f = entity.facets
      return (
        <SectionCard title="TV show">
          <FieldRow
            label="Year"
            value={f.year != null ? String(f.year) : null}
          />
          <FieldRow label="Creators" value={f.creators.join(', ') || null} />
          <FieldRow label="Cast" value={f.cast.join(', ') || null} />
          <FieldRow label="Genre" value={f.genre.join(', ') || null} />
          <FieldRow
            label="Seasons"
            value={f.seasons != null ? String(f.seasons) : null}
          />
          <FieldRow label="Synopsis" value={f.synopsis} />
          <FieldRow label="Known for" value={f.whereKnownFor} />
        </SectionCard>
      )
    }
    case 'song': {
      const f = entity.facets
      return (
        <SectionCard title="Song">
          <FieldRow label="Artists" value={f.artists.join(', ') || null} />
          <FieldRow label="Album" value={f.album} />
          <FieldRow
            label="Year"
            value={f.year != null ? String(f.year) : null}
          />
          <FieldRow label="Genre" value={f.genre.join(', ') || null} />
          <FieldRow label="Duration" value={f.duration} />
          <FieldRow label="Label" value={f.label} />
          <FieldRow label="Notable for" value={f.notableFor} />
        </SectionCard>
      )
    }
    case 'game': {
      const f = entity.facets
      return (
        <SectionCard title="Game">
          <FieldRow
            label="Year"
            value={f.year != null ? String(f.year) : null}
          />
          <FieldRow label="Platforms" value={f.platforms.join(', ') || null} />
          <FieldRow
            label="Developers"
            value={f.developers.join(', ') || null}
          />
          <FieldRow
            label="Publishers"
            value={f.publishers.join(', ') || null}
          />
          <FieldRow label="Genre" value={f.genre.join(', ') || null} />
          <FieldRow label="Synopsis" value={f.synopsis} />
        </SectionCard>
      )
    }
    case 'automobile': {
      const f = entity.facets
      return (
        <SectionCard title="Vehicle">
          <FieldRow label="Make" value={f.make} />
          <FieldRow label="Model" value={f.model} />
          <FieldRow
            label="Year"
            value={f.year != null ? String(f.year) : null}
          />
          <FieldRow label="Body style" value={f.bodyStyle} />
          <FieldRow label="Powertrain" value={f.powertrain} />
          <LabelValueGrid rows={f.notableSpecs} />
        </SectionCard>
      )
    }
    case 'furniture': {
      const f = entity.facets
      return (
        <SectionCard title="Furniture">
          <FieldRow label="Type" value={f.type} />
          <FieldRow label="Style" value={f.style} />
          <FieldRow label="Era" value={f.era} />
          <FieldRow label="Materials" value={f.materials.join(', ') || null} />
          <FieldRow label="Dimensions" value={f.dimensionsEstimate} />
          <FieldRow label="Care" value={f.care} />
        </SectionCard>
      )
    }
    case 'electronics': {
      const f = entity.facets
      return (
        <SectionCard title="Electronics">
          <FieldRow label="Brand" value={f.brand} />
          <FieldRow label="Model" value={f.model} />
          <FieldRow label="Category" value={f.category} />
          <FieldRow
            label="Connectivity"
            value={f.connectivity.join(', ') || null}
          />
          <LabelValueGrid rows={f.keySpecs} />
        </SectionCard>
      )
    }
    case 'clothing': {
      const f = entity.facets
      return (
        <SectionCard title="Clothing">
          <FieldRow label="Type" value={f.garmentType} />
          <FieldRow label="Brand" value={f.brand} />
          <FieldRow label="Style" value={f.style} />
          <FieldRow label="Size estimate" value={f.sizeEstimate} />
          <FieldRow label="Materials" value={f.materials.join(', ') || null} />
          <FieldRow label="Care" value={f.care} />
        </SectionCard>
      )
    }
    case 'pet': {
      const f = entity.facets
      return (
        <SectionCard title="Pet">
          <FieldRow label="Species" value={f.species} />
          <FieldRow label="Breed estimate" value={f.breedEstimate} />
          <FieldRow label="Age estimate" value={f.ageEstimate} />
          <ListBlock items={f.traits} />
          <ListBlock items={f.careBasics} />
        </SectionCard>
      )
    }
    case 'animal': {
      const f = entity.facets
      return (
        <SectionCard title="Animal">
          <FieldRow label="Species" value={f.species} />
          <FieldRow label="Common name" value={f.commonName} />
          <FieldRow label="Habitat" value={f.habitat} />
          <FieldRow label="Conservation" value={f.conservationStatus} />
          <ListBlock items={f.traits} />
        </SectionCard>
      )
    }
    case 'plant': {
      const f = entity.facets
      return (
        <SectionCard title="Plant">
          <FieldRow label="Common name" value={f.commonName} />
          <FieldRow label="Scientific name" value={f.scientificName} />
          <FieldRow label="Light" value={f.lightNeeds} />
          <FieldRow label="Toxicity" value={f.toxicityNotes} />
          <ListBlock items={f.careBasics} />
        </SectionCard>
      )
    }
    case 'artwork': {
      const f = entity.facets
      return (
        <SectionCard title="Artwork">
          <FieldRow label="Artist" value={f.artist} />
          <FieldRow label="Medium" value={f.medium} />
          <FieldRow label="Year" value={f.year} />
          <FieldRow label="Style" value={f.style} />
          <FieldRow label="Subject" value={f.subject} />
          <FieldRow label="Significance" value={f.significance} />
        </SectionCard>
      )
    }
    case 'landmark': {
      const f = entity.facets
      return (
        <SectionCard title="Landmark">
          <FieldRow label="Location" value={f.location} />
          <FieldRow label="Country" value={f.country} />
          <FieldRow label="Built / opened" value={f.builtOrOpened} />
          <FieldRow label="Significance" value={f.significance} />
          <ListBlock items={f.visitorTips} />
        </SectionCard>
      )
    }
    case 'person': {
      const f = entity.facets
      return (
        <SectionCard title="Person">
          <FieldRow label="Occupation" value={f.occupation} />
          <FieldRow label="Nationality" value={f.nationality} />
          <FieldRow label="Lifespan" value={f.lifespan} />
          <ListBlock items={f.knownFor} />
          <ListBlock items={f.notableWorks} />
        </SectionCard>
      )
    }
    case 'sex_position': {
      const f = entity.facets
      return (
        <SectionCard title="Details">
          <FieldRow
            label="Also known as"
            value={f.commonNames?.join(', ') || null}
          />
          <FieldRow label="Difficulty" value={f.difficulty} />
          <FieldRow label="Description" value={f.description} />
          <div className="stack">
            <span className="field-label">Tips</span>
            <ListBlock items={f.tips} />
          </div>
          <div className="stack">
            <span className="field-label">Safety</span>
            <ListBlock items={f.safetyNotes} />
          </div>
        </SectionCard>
      )
    }
    case 'other': {
      const f = entity.facets
      return (
        <SectionCard title="Details">
          <FieldRow label="Category guess" value={f.categoryGuess} />
          <LabelValueGrid rows={f.attributes} />
          <ListBlock items={f.relatedTopics} />
          <FieldRow label="Learn more" value={f.howToLearnMore} />
        </SectionCard>
      )
    }
    default:
      return null
  }
}
